import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdminPermission, requireCustomer } from '../middleware/auth.js';
import {
  PaymentSessionError,
  cleanupExpiredPaymentSessions,
  createPaymentSession,
  cancelPaymentSessionByToken,
  finalizePaidSession,
  releasePendingSessionById
} from '../lib/payment-sessions.js';
import { findEtransferMatch, isEtransferMonitorConfigured } from '../lib/etransfer.js';
import { sendOrderPlacedEmail } from '../lib/email.js';
import {
  createSquarePaymentLink,
  deleteSquarePaymentLink,
  isSquareConfigured,
  retrieveSquareOrder,
  verifySquareWebhookSignature
} from '../lib/square.js';
import { ADMIN_PERMISSION } from '../lib/admin-permissions.js';
import { calculateTaxQuote, resolveCountryRegion } from '../lib/tax.js';

const router = Router();
const FREE_SHIPPING_THRESHOLD_CENTS = 35000;
const STANDARD_SHIPPING_FEE_CENTS = 1900;

const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  color: z.string().min(1).max(40),
  size: z.string().min(1).max(20),
  quantity: z.coerce.number().int().min(1).max(99)
});

const shippingSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phone: z.string().min(7).max(30),
  addressLine1: z.string().min(3).max(140),
  addressLine2: z.string().max(140).optional().or(z.literal('')),
  city: z.string().min(2).max(80),
  province: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(80)
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  shipping: shippingSchema.optional(),
  paymentMethod: z.enum(['SQUARE', 'ETRANSFER']).default('SQUARE')
});

const orderStatusSchema = z.object({
  status: z.enum(['PLACED', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().max(120).optional().or(z.literal('')),
  confirmDelivered: z.boolean().optional()
});

const restoreHistorySchema = z.object({
  confirmRestore: z.boolean().optional()
});

const salesMonthSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional()
});

const ADMIN_ORDER_INCLUDE = {
  customer: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true
    }
  },
  items: true
};

function monthKeyInToronto(value) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(new Date(value));
  const year = parts.find((item) => item.type === 'year')?.value || '';
  const month = parts.find((item) => item.type === 'month')?.value || '';
  return year && month ? `${year}-${month}` : '';
}

function resolveCurrentTorontoMonth() {
  return monthKeyInToronto(new Date());
}

function normalizeShipping(customer, shippingInput) {
  const fullName = {
    firstName: shippingInput?.firstName || customer.firstName,
    lastName: shippingInput?.lastName || customer.lastName
  };

  const shipping = {
    ...fullName,
    phone: shippingInput?.phone || customer.phone,
    addressLine1: shippingInput?.addressLine1 || customer.addressLine1,
    addressLine2: shippingInput?.addressLine2 || customer.addressLine2 || '',
    city: shippingInput?.city || customer.city,
    province: shippingInput?.province || customer.province,
    postalCode: shippingInput?.postalCode || customer.postalCode,
    country: shippingInput?.country || customer.country || 'Canada'
  };

  const parsed = shippingSchema.safeParse(shipping);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = firstIssue?.path?.join('.') || 'shipping';
    throw new PaymentSessionError(400, `Invalid shipping profile: ${field} ${firstIssue?.message || ''}`.trim());
  }
  const resolved = resolveCountryRegion(parsed.data.country, parsed.data.province);
  if (!resolved.valid) {
    throw new PaymentSessionError(400, 'Country and province/state combination is invalid.');
  }

  return {
    ...parsed.data,
    country: resolved.countryName,
    province: resolved.regionName
  };
}

function getPaymentIdFromSquareOrder(squareOrder) {
  const tender = squareOrder?.tenders?.find((row) => row?.payment_id || row?.id);
  return tender?.payment_id || tender?.id || '';
}

function shippingFeeCents(subtotalCents) {
  return Number(subtotalCents || 0) >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_FEE_CENTS;
}

function sessionPayload(session) {
  const subtotalCents = Number(session.subtotalCents || 0);
  const taxQuote = calculateTaxQuote({
    country: session.shippingCountry,
    region: session.shippingProvince,
    subtotalCents
  });
  const taxCents = Number(taxQuote.taxCents || 0);
  const shippingCents = shippingFeeCents(subtotalCents);
  const etransferVerificationCents = Number(session.etransferVerificationCents || 0);
  const etransferRecipient = String(process.env.ETRANSFER_RECEIVER_EMAIL || '').trim();
  return {
    token: session.publicToken,
    status: session.status,
    paymentMethod: session.paymentMethod,
    subtotalCents,
    taxCents,
    shippingCents,
    taxQuote,
    totalCents: session.totalCents,
    currency: session.currency,
    checkoutUrl: session.checkoutUrl,
    expiresAt: session.expiresAt,
    etransferMatchedAt: session.etransferMatchedAt || null,
    etransferVerificationCents,
    etransferRecipient: etransferRecipient || null,
    etransferMonitorConfigured: isEtransferMonitorConfigured(),
    etransferLastReason: session?._etransferLastReason || null,
    order: session.order || null
  };
}

function normalizeHistoryRecord(record) {
  return {
    ...record,
    isHistorical: true
  };
}

async function moveOrderToHistory(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, customer: true }
    });

    if (!order) return null;

    const history = await tx.orderHistory.create({
      data: {
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        status: 'DELIVERED',
        paymentMethod: order.paymentMethod,
        paymentReference: order.paymentReference,
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
        paymentSessionId: order.paymentSessionId,
        shippingName: order.shippingName,
        shippingPhone: order.shippingPhone,
        shippingEmail: order.shippingEmail,
        shippingAddress1: order.shippingAddress1,
        shippingAddress2: order.shippingAddress2,
        shippingCity: order.shippingCity,
        shippingProvince: order.shippingProvince,
        shippingPostalCode: order.shippingPostalCode,
        shippingCountry: order.shippingCountry,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            color: item.color,
            size: item.size,
            sku: item.sku,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
            createdAt: item.createdAt
          }))
        }
      },
      include: ADMIN_ORDER_INCLUDE
    });

    await tx.order.delete({ where: { id: order.id } });
    return history;
  });
}

async function restoreHistoryToActiveOrder(historyId) {
  return prisma.$transaction(async (tx) => {
    const history = await tx.orderHistory.findUnique({
      where: { id: historyId },
      include: { items: true, customer: true }
    });

    if (!history) return null;

    const restored = await tx.order.create({
      data: {
        orderNumber: history.orderNumber,
        customerId: history.customerId,
        status: 'SHIPPED',
        paymentMethod: history.paymentMethod,
        paymentReference: history.paymentReference,
        subtotalCents: history.subtotalCents,
        totalCents: history.totalCents,
        paymentSessionId: history.paymentSessionId,
        shippingName: history.shippingName,
        shippingPhone: history.shippingPhone,
        shippingEmail: history.shippingEmail,
        shippingAddress1: history.shippingAddress1,
        shippingAddress2: history.shippingAddress2,
        shippingCity: history.shippingCity,
        shippingProvince: history.shippingProvince,
        shippingPostalCode: history.shippingPostalCode,
        shippingCountry: history.shippingCountry,
        trackingNumber: history.trackingNumber,
        createdAt: history.createdAt,
        items: {
          create: history.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            color: item.color,
            size: item.size,
            sku: item.sku,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
            createdAt: item.createdAt
          }))
        }
      },
      include: ADMIN_ORDER_INCLUDE
    });

    await tx.orderHistory.delete({ where: { id: history.id } });
    return restored;
  });
}

async function syncPaidFromSquareIfPossible(session) {
  if (!session || session.status !== 'PENDING' || !session.squareOrderId) return session;
  const squareOrder = await retrieveSquareOrder(session.squareOrderId);
  const paymentId = getPaymentIdFromSquareOrder(squareOrder);
  if (!paymentId) return session;

  await finalizeAndNotify({
    paymentSessionId: session.id,
    squarePaymentId: paymentId,
    paymentMethod: 'SQUARE',
    paymentReference: paymentId || session.squareOrderId || null
  });

  return prisma.paymentSession.findUnique({
    where: { id: session.id },
    include: {
      order: { include: { items: true } }
    }
  });
}

async function sendOrderPlacedEmailOnce({ sessionId, order }) {
  if (!sessionId || !order?.id) return;
  const updated = await prisma.paymentSession.updateMany({
    where: {
      id: sessionId,
      confirmationEmailSentAt: null
    },
    data: {
      confirmationEmailSentAt: new Date()
    }
  });

  if (updated.count !== 1) return;

  const customer = await prisma.customerUser.findUnique({
    where: { id: order.customerId },
    select: { email: true, firstName: true }
  });

  if (!customer?.email) return;

  await sendOrderPlacedEmail({
    email: customer.email,
    firstName: customer.firstName || '',
    orderNumber: order.orderNumber
  });
}

async function finalizeAndNotify({
  paymentSessionId,
  squarePaymentId,
  paymentMethod,
  paymentReference
}) {
  const order = await finalizePaidSession({
    paymentSessionId,
    squarePaymentId,
    paymentMethod,
    paymentReference
  });
  await sendOrderPlacedEmailOnce({ sessionId: paymentSessionId, order });
  return order;
}

async function syncPaidFromEtransferIfPossible(session) {
  if (!session || session.status !== 'PENDING' || session.paymentMethod !== 'ETRANSFER') return session;

  let match = null;
  try {
    match = await findEtransferMatch({
      totalCents: session.totalCents,
      createdAt: session.createdAt
    });
  } catch (error) {
    console.warn('[etransfer] monitor failed', error?.message || error);
    return session;
  }

  if (!match.matched) {
    if (session && typeof session === 'object') {
      session._etransferLastReason = match?.reason || 'MATCH_NOT_FOUND';
    }
    return session;
  }

  if (match.matchRef) {
    const alreadyUsed = await prisma.paymentSession.findFirst({
      where: {
        etransferMatchRef: match.matchRef,
        id: { not: session.id }
      },
      select: { id: true }
    });
    if (alreadyUsed) return session;
  }

  await prisma.paymentSession.update({
    where: { id: session.id },
    data: {
      etransferMatchedAt: match.matchedAt || new Date(),
      etransferMatchRef: match.matchRef || null
    }
  });

  await finalizeAndNotify({
    paymentSessionId: session.id,
    paymentMethod: 'ETRANSFER',
    paymentReference: match.matchRef || null
  });

  return prisma.paymentSession.findUnique({
    where: { id: session.id },
    include: {
      order: { include: { items: true } }
    }
  });
}

router.post('/payment-session', requireCustomer, async (req, res) => {
  await cleanupExpiredPaymentSessions();

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid order payload', errors: parsed.error.issues });
  }

  const customer = await prisma.customerUser.findUnique({ where: { id: req.auth.id } });
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  let session = null;
  try {
    const shipping = normalizeShipping(customer, parsed.data.shipping);
    const paymentMethod = parsed.data.paymentMethod || 'SQUARE';

    if (paymentMethod === 'ETRANSFER') {
      const existingEtransfer = await prisma.paymentSession.findFirst({
        where: {
          customerId: customer.id,
          paymentMethod: 'ETRANSFER',
          status: 'PENDING',
          expiresAt: { gt: new Date() }
        },
        include: {
          order: { include: { items: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existingEtransfer) {
        return res.status(200).json({
          ...sessionPayload(existingEtransfer),
          reused: true
        });
      }
    }

    if (paymentMethod === 'SQUARE' && !isSquareConfigured()) {
      return res.status(500).json({
        message: 'Square is not configured. Please set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID.'
      });
    }

    session = await createPaymentSession({
      customer,
      items: parsed.data.items,
      shipping,
      paymentMethod
    });

    let updated = await prisma.paymentSession.findUnique({
      where: { id: session.id },
      include: {
        order: { include: { items: true } }
      }
    });

    if (paymentMethod === 'SQUARE') {
      const returnBase = process.env.CHECKOUT_RETURN_BASE_URL || `${req.protocol}://${req.get('host')}`;
      const redirectUrl = `${returnBase}/checkout?paymentSession=${encodeURIComponent(session.publicToken)}`;

      const square = await createSquarePaymentLink({
        sessionToken: session.publicToken,
        orderTitle: `Luxury Station - ${session.items.length} item(s)`,
        totalCents: session.totalCents,
        redirectUrl,
        shippingEmail: customer.email
      });

      updated = await prisma.paymentSession.update({
        where: { id: session.id },
        data: {
          squarePaymentLinkId: square.paymentLinkId || null,
          squareOrderId: square.squareOrderId || null,
          checkoutUrl: square.checkoutUrl || null
        },
        include: {
          order: { include: { items: true } }
        }
      });
    }

    return res.status(201).json(sessionPayload(updated));
  } catch (error) {
    if (session?.id) {
      await releasePendingSessionById({ sessionId: session.id, nextStatus: 'FAILED' });
      if (session.squarePaymentLinkId) {
        await deleteSquarePaymentLink(session.squarePaymentLinkId);
      }
    }
    if (error instanceof PaymentSessionError) {
      return res.status(error.status).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Failed to create payment session' });
  }
});

router.get('/payment-session/:token/status', requireCustomer, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  await cleanupExpiredPaymentSessions();

  const token = String(req.params.token || '');
  let session = await prisma.paymentSession.findUnique({
    where: { publicToken: token },
    include: {
      order: { include: { items: true } }
    }
  });

  if (!session || session.customerId !== req.auth.id) {
    return res.status(404).json({ message: 'Payment session not found' });
  }

  if (session.status === 'PENDING' && session.expiresAt < new Date()) {
    await releasePendingSessionById({ sessionId: session.id, nextStatus: 'EXPIRED' });
    if (session.squarePaymentLinkId) {
      await deleteSquarePaymentLink(session.squarePaymentLinkId);
    }
    session = await prisma.paymentSession.findUnique({
      where: { id: session.id },
      include: {
        order: { include: { items: true } }
      }
    });
  }

  if (session.paymentMethod === 'SQUARE') {
    session = await syncPaidFromSquareIfPossible(session);
  } else if (session.paymentMethod === 'ETRANSFER') {
    session = await syncPaidFromEtransferIfPossible(session);
  }

  return res.json(sessionPayload(session));
});

router.post('/payment-session/:token/cancel', requireCustomer, async (req, res) => {
  const token = String(req.params.token || '');
  const session = await prisma.paymentSession.findUnique({ where: { publicToken: token } });
  if (!session || session.customerId !== req.auth.id) {
    return res.status(404).json({ message: 'Payment session not found' });
  }

  await cancelPaymentSessionByToken({ token, customerId: req.auth.id });
  if (session.squarePaymentLinkId) {
    await deleteSquarePaymentLink(session.squarePaymentLinkId);
  }

  return res.json({ success: true });
});

router.post('/square/webhook', async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body || {});
  const signature = req.headers['x-square-hmacsha256-signature'] || req.headers['x-square-signature'] || '';
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  if (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    const isValid = verifySquareWebhookSignature({ signature, rawBody, notificationUrl });
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid webhook signature' });
    }
  }

  let event = null;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ message: 'Invalid webhook payload' });
  }

  const eventType = String(event?.type || '').toLowerCase();
  const paymentObject = event?.data?.object?.payment || event?.data?.object?.payment_updated?.payment || null;
  const orderId = paymentObject?.order_id;
  const paymentStatus = String(paymentObject?.status || '').toUpperCase();
  const paymentId = paymentObject?.id || '';

  if (!orderId || (!eventType.includes('payment') && !paymentStatus)) {
    return res.json({ ok: true });
  }

  const session = await prisma.paymentSession.findFirst({
    where: { squareOrderId: orderId },
    include: { order: true }
  });

  if (!session || session.order) {
    return res.json({ ok: true });
  }

  if (paymentStatus === 'COMPLETED') {
    await finalizeAndNotify({
      paymentSessionId: session.id,
      squarePaymentId: paymentId,
      paymentMethod: 'SQUARE',
      paymentReference: paymentId || orderId || null
    });
    return res.json({ ok: true });
  }

  if (['FAILED', 'CANCELED', 'CANCELLED'].includes(paymentStatus)) {
    await releasePendingSessionById({ sessionId: session.id, nextStatus: 'FAILED' });
    return res.json({ ok: true });
  }

  return res.json({ ok: true });
});

router.post('/', requireCustomer, async (_req, res) => {
  return res.status(410).json({
    message: 'Direct order placement is disabled. Please use the payment session checkout flow.'
  });
});

router.get('/mine', requireCustomer, async (req, res) => {
  const [activeOrders, historyOrders] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: req.auth.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.orderHistory.findMany({
      where: { customerId: req.auth.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const merged = [
    ...activeOrders.map((item) => ({ ...item, isHistorical: false })),
    ...historyOrders.map(normalizeHistoryRecord)
  ].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));

  return res.json(merged);
});

router.get('/lookup', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const phone = String(req.query.phone || '').trim();

  if (!email || !phone) {
    return res.status(400).json({ message: 'Email and phone are required' });
  }

  const customer = await prisma.customerUser.findFirst({ where: { email, phone } });
  if (!customer) return res.json([]);

  const [activeOrders, historyOrders] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: customer.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.orderHistory.findMany({
      where: { customerId: customer.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const merged = [
    ...activeOrders.map((item) => ({ ...item, isHistorical: false })),
    ...historyOrders.map(normalizeHistoryRecord)
  ].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));

  return res.json(merged);
});

router.get('/history', requireAdminPermission(ADMIN_PERMISSION.ORDERS), async (_req, res) => {
  const orders = await prisma.orderHistory.findMany({
    include: ADMIN_ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });
  return res.json(orders.map(normalizeHistoryRecord));
});

router.delete('/history/:id', requireAdminPermission(ADMIN_PERMISSION.ORDERS), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: '无效历史订单ID' });

  const exists = await prisma.orderHistory.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ message: '历史订单不存在' });

  await prisma.orderHistory.delete({ where: { id } });
  return res.json({ deleted: true, id });
});

router.post('/history/:id/restore', requireAdminPermission(ADMIN_PERMISSION.ORDERS), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = restoreHistorySchema.safeParse(req.body || {});

  if (!id || !parsed.success || !parsed.data.confirmRestore) {
    return res.status(400).json({ message: '请先确认后再执行回滚到订单列表' });
  }

  try {
    const restored = await restoreHistoryToActiveOrder(id);
    if (!restored) {
      return res.status(404).json({ message: '历史订单不存在' });
    }
    return res.json({ restored: true, order: restored });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: '恢复失败：订单号或支付关联冲突' });
    }
    return res.status(500).json({ message: error.message || '恢复历史订单失败' });
  }
});

router.get('/', requireAdminPermission(ADMIN_PERMISSION.ORDERS), async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: ADMIN_ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' }
  });

  return res.json(orders);
});

router.delete('/:id', requireAdminPermission(ADMIN_PERMISSION.ORDERS), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: '无效订单ID' });

  const exists = await prisma.order.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ message: '订单不存在' });

  await prisma.order.delete({ where: { id } });
  return res.json({ deleted: true, id });
});

router.patch('/:id/status', requireAdminPermission(ADMIN_PERMISSION.ORDERS), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = orderStatusSchema.safeParse(req.body);

  if (!id || !parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.success ? [] : parsed.error.issues });
  }

  const status = parsed.data.status;
  const trackingNumber =
    status === 'SHIPPED' || status === 'DELIVERED' ? parsed.data.trackingNumber?.trim() || null : null;

  if (status === 'DELIVERED') {
    if (!parsed.data.confirmDelivered) {
      return res.status(400).json({ message: '请确认已送达后再归档到历史订单' });
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: '订单不存在' });
    }

    if (trackingNumber !== existing.trackingNumber) {
      await prisma.order.update({
        where: { id },
        data: { trackingNumber }
      });
    }

    const moved = await moveOrderToHistory(id);
    if (!moved) {
      return res.status(404).json({ message: '订单不存在或已归档' });
    }
    return res.json({ movedToHistory: true, order: normalizeHistoryRecord(moved) });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status, trackingNumber }
  });

  return res.json(updated);
});

router.get('/sales-summary', requireAdminPermission(ADMIN_PERMISSION.SALES_REPORTS), async (req, res) => {
  const parsed = salesMonthSchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid month. Use YYYY-MM.' });
  }

  const month = parsed.data.month || resolveCurrentTorontoMonth();

  const [orders, orderHistory] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentReference: true,
        subtotalCents: true,
        totalCents: true,
        createdAt: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.orderHistory.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        paymentReference: true,
        subtotalCents: true,
        totalCents: true,
        createdAt: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const merged = [
    ...orders.map((item) => ({ ...item, isHistorical: false })),
    ...orderHistory.map((item) => ({ ...item, isHistorical: true }))
  ].filter((item) => monthKeyInToronto(item.createdAt) === month);

  const squareItems = merged.filter((item) => item.paymentMethod === 'SQUARE');
  const etransferItems = merged.filter((item) => item.paymentMethod === 'ETRANSFER');
  const sum = (rows = []) => rows.reduce((total, row) => total + Number(row.totalCents || 0), 0);
  const productStatsMap = new Map();

  merged.forEach((order) => {
    const seenInOrder = new Set();
    (order.items || []).forEach((line) => {
      const productId = Number(line.productId || 0);
      if (!productId) return;
      const key = String(productId);
      if (!productStatsMap.has(key)) {
        productStatsMap.set(key, {
          productId,
          productName: line.productName || `#${productId}`,
          paidOrderCount: 0,
          soldQuantity: 0
        });
      }
      const stat = productStatsMap.get(key);
      stat.soldQuantity += Number(line.quantity || 0);
      if (!seenInOrder.has(key)) {
        stat.paidOrderCount += 1;
        seenInOrder.add(key);
      }
    });
  });

  const productStats = [...productStatsMap.values()].sort((a, b) => {
    if (b.paidOrderCount !== a.paidOrderCount) return b.paidOrderCount - a.paidOrderCount;
    if (b.soldQuantity !== a.soldQuantity) return b.soldQuantity - a.soldQuantity;
    return String(a.productName || '').localeCompare(String(b.productName || ''));
  });

  return res.json({
    month,
    timezone: 'America/Toronto',
    totals: {
      orders: merged.length,
      totalCents: sum(merged),
      square: { orders: squareItems.length, totalCents: sum(squareItems) },
      etransfer: { orders: etransferItems.length, totalCents: sum(etransferItems) }
    },
    productStats,
    items: merged
  });
});

export default router;
