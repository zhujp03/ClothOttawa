import crypto from 'node:crypto';
import { prisma } from './prisma.js';
import { calculateTaxQuote } from './tax.js';

const HOLD_MINUTES = 15;

export class PaymentSessionError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function holdExpiresAt() {
  return new Date(Date.now() + HOLD_MINUTES * 60 * 1000);
}

function effectiveProductPriceCents(product) {
  const basePrice = Number(product?.priceCents || 0);
  const saleEnabled = Boolean(product?.isOnSale);
  const salePrice = Number(product?.salePriceCents || 0);
  if (saleEnabled && Number.isInteger(salePrice) && salePrice > 0 && salePrice < basePrice) {
    return salePrice;
  }
  return basePrice;
}

async function allocateEtransferVerificationCents(tx, subtotalCents) {
  const active = await tx.paymentSession.findMany({
    where: {
      paymentMethod: 'ETRANSFER',
      status: 'PENDING',
      subtotalCents,
      expiresAt: { gt: new Date() }
    },
    select: { etransferVerificationCents: true }
  });

  const used = new Set(active.map((row) => Number(row.etransferVerificationCents || 0)).filter((n) => n >= 0));
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const next = crypto.randomInt(0, 6);
    if (!used.has(next)) return next;
  }
  for (let next = 0; next <= 5; next += 1) {
    if (!used.has(next)) return next;
  }
  return null;
}

function todayToken() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${date}`;
}

export function buildOrderNumber() {
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `NA-${todayToken()}-${random}`;
}

async function releaseSessionHoldTx(tx, sessionId, nextStatus) {
  const session = await tx.paymentSession.findUnique({
    where: { id: sessionId },
    include: { items: true }
  });

  if (!session || session.status !== 'PENDING') {
    return session;
  }

  for (const item of session.items) {
    const variant = await tx.productVariant.findFirst({
      where: {
        productId: item.productId,
        color: item.color,
        size: item.size
      }
    });

    if (!variant) continue;
    const nextReserved = Math.max(0, Number(variant.reservedStock || 0) - Number(item.quantity || 0));

    await tx.productVariant.update({
      where: { id: variant.id },
      data: { reservedStock: nextReserved }
    });
  }

  return tx.paymentSession.update({
    where: { id: sessionId },
    data: { status: nextStatus }
  });
}

export async function cleanupExpiredPaymentSessions() {
  const expired = await prisma.paymentSession.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: new Date() }
    },
    select: {
      id: true,
      squarePaymentLinkId: true
    },
    take: 100
  });

  for (const session of expired) {
    await prisma.$transaction(async (tx) => {
      await releaseSessionHoldTx(tx, session.id, 'EXPIRED');
    });
  }

  return expired;
}

export async function createPaymentSession({
  customer,
  items,
  shipping,
  paymentMethod = 'SQUARE'
}) {
  if (!items?.length) {
    throw new PaymentSessionError(400, 'Cart is empty');
  }

  const created = await prisma.$transaction(async (tx) => {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      include: { variants: true }
    });
    const productMap = new Map(products.map((product) => [product.id, product]));

    const lineItems = [];
    let subtotalCents = 0;

    for (const item of items) {
      const quantity = Number(item.quantity || 0);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new PaymentSessionError(400, 'Invalid quantity');
      }

      const product = productMap.get(item.productId);
      if (!product) {
        throw new PaymentSessionError(400, `Product ${item.productId} not found or inactive`);
      }

      const variant = product.variants.find((entry) => entry.color === item.color && entry.size === item.size);
      if (!variant) {
        throw new PaymentSessionError(
          400,
          `Variant not found for product "${product.name}" (${item.color} / ${item.size})`
        );
      }

      const available = Number(variant.stock || 0) - Number(variant.reservedStock || 0);
      if (available < quantity) {
        throw new PaymentSessionError(
          409,
          `Insufficient available stock for ${product.name} (${item.color} / ${item.size})`
        );
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          reservedStock: Number(variant.reservedStock || 0) + quantity
        }
      });

      const unitPriceCents = effectiveProductPriceCents(product);
      const lineTotalCents = quantity * unitPriceCents;
      subtotalCents += lineTotalCents;

      lineItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        color: variant.color,
        size: variant.size,
        sku: variant.sku,
        quantity,
        unitPriceCents,
        lineTotalCents
      });
    }

    const taxQuote = calculateTaxQuote({
      country: shipping.country,
      region: shipping.province,
      subtotalCents
    });
    const taxCents = Number(taxQuote.taxCents || 0);
    const etransferVerificationCents =
      paymentMethod === 'ETRANSFER' ? await allocateEtransferVerificationCents(tx, subtotalCents) : 0;
    if (paymentMethod === 'ETRANSFER' && etransferVerificationCents == null) {
      throw new PaymentSessionError(
        409,
        'Too many pending e-transfer sessions for the same amount. Please wait a minute and try again.'
      );
    }
    const totalCents = subtotalCents + taxCents + etransferVerificationCents;
    const token = crypto.randomUUID();
    return tx.paymentSession.create({
      data: {
        publicToken: token,
        customerId: customer.id,
        status: 'PENDING',
        paymentMethod,
        etransferVerificationCents,
        subtotalCents,
        totalCents,
        currency: 'CAD',
        shippingName: `${shipping.firstName} ${shipping.lastName}`.trim(),
        shippingPhone: shipping.phone,
        shippingEmail: customer.email,
        shippingAddress1: shipping.addressLine1,
        shippingAddress2: shipping.addressLine2 || null,
        shippingCity: shipping.city,
        shippingProvince: shipping.province,
        shippingPostalCode: shipping.postalCode,
        shippingCountry: shipping.country,
        expiresAt: holdExpiresAt(),
        items: {
          create: lineItems
        }
      },
      include: {
        items: true
      }
    });
  });

  return created;
}

export async function cancelPaymentSessionByToken({ token, customerId }) {
  const session = await prisma.paymentSession.findUnique({ where: { publicToken: token } });
  if (!session || session.customerId !== customerId) {
    throw new PaymentSessionError(404, 'Payment session not found');
  }

  await prisma.$transaction(async (tx) => {
    await releaseSessionHoldTx(tx, session.id, 'CANCELLED');
  });

  return true;
}

export async function releasePendingSessionById({ sessionId, nextStatus = 'CANCELLED' }) {
  await prisma.$transaction(async (tx) => {
    await releaseSessionHoldTx(tx, sessionId, nextStatus);
  });
}

export async function finalizePaidSession({
  paymentSessionId,
  squarePaymentId,
  paymentMethod = 'SQUARE',
  paymentReference = null
}) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.paymentSession.findUnique({
      where: { id: paymentSessionId },
      include: {
        items: true,
        order: {
          include: { items: true }
        }
      }
    });

    if (!session) {
      throw new PaymentSessionError(404, 'Payment session not found');
    }

    if (session.order) {
      return session.order;
    }

    if (session.status !== 'PENDING' && session.status !== 'PAID') {
      throw new PaymentSessionError(409, 'Payment session is not payable');
    }

    for (const item of session.items) {
      const variant = await tx.productVariant.findFirst({
        where: {
          productId: item.productId,
          color: item.color,
          size: item.size
        }
      });

      if (!variant) {
        throw new PaymentSessionError(409, `Variant missing during finalization (${item.color}/${item.size})`);
      }

      if (Number(variant.reservedStock || 0) < Number(item.quantity || 0)) {
        throw new PaymentSessionError(409, `Reserved stock mismatch for SKU ${item.sku || '-'}`);
      }

      if (Number(variant.stock || 0) < Number(item.quantity || 0)) {
        throw new PaymentSessionError(409, `Stock mismatch for SKU ${item.sku || '-'}`);
      }

      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stock: Number(variant.stock || 0) - Number(item.quantity || 0),
          reservedStock: Number(variant.reservedStock || 0) - Number(item.quantity || 0)
        }
      });
    }

    const order = await tx.order.create({
      data: {
        orderNumber: buildOrderNumber(),
        customerId: session.customerId,
        paymentSessionId: session.id,
        status: 'PAID',
        paymentMethod: paymentMethod || session.paymentMethod || 'SQUARE',
        paymentReference: paymentReference || session.squarePaymentId || null,
        subtotalCents: session.subtotalCents,
        totalCents: session.totalCents,
        shippingName: session.shippingName,
        shippingPhone: session.shippingPhone,
        shippingEmail: session.shippingEmail,
        shippingAddress1: session.shippingAddress1,
        shippingAddress2: session.shippingAddress2,
        shippingCity: session.shippingCity,
        shippingProvince: session.shippingProvince,
        shippingPostalCode: session.shippingPostalCode,
        shippingCountry: session.shippingCountry,
        items: {
          create: session.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            color: item.color,
            size: item.size,
            sku: item.sku,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents
          }))
        }
      },
      include: { items: true }
    });

    await tx.paymentSession.update({
      where: { id: session.id },
      data: {
        status: 'PAID',
        paidAt: session.paidAt || new Date(),
        paymentMethod: paymentMethod || session.paymentMethod || 'SQUARE',
        squarePaymentId: squarePaymentId || session.squarePaymentId || null
      }
    });

    return order;
  });
}
