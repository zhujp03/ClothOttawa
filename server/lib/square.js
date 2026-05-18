import crypto from 'node:crypto';

const DEFAULT_SQUARE_VERSION = '2026-01-22';

function squareBaseUrl() {
  const env = String(process.env.SQUARE_ENV || 'sandbox').toLowerCase();
  return env === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
}

function squareHeaders() {
  return {
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
    'Square-Version': process.env.SQUARE_VERSION || DEFAULT_SQUARE_VERSION,
    'Content-Type': 'application/json'
  };
}

export function isSquareConfigured() {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

async function squareRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${squareBaseUrl()}${path}`, {
    method,
    headers: squareHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.errors?.[0]?.detail || data?.errors?.[0]?.code || data?.message || `Square API request failed: ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export async function createSquarePaymentLink({
  sessionToken,
  orderTitle,
  totalCents,
  redirectUrl,
  shippingEmail
}) {
  const payload = {
    idempotency_key: crypto.randomUUID(),
    quick_pay: {
      name: orderTitle,
      price_money: {
        amount: totalCents,
        currency: 'CAD'
      },
      location_id: process.env.SQUARE_LOCATION_ID
    },
    checkout_options: {
      redirect_url: redirectUrl
    },
    pre_populated_data: shippingEmail
      ? {
          buyer_email: shippingEmail
        }
      : undefined,
    description: `Nimbus checkout ${sessionToken}`
  };

  const data = await squareRequest('/v2/online-checkout/payment-links', {
    method: 'POST',
    body: payload
  });

  const paymentLink = data?.payment_link || {};
  return {
    paymentLinkId: paymentLink.id || '',
    checkoutUrl: paymentLink.url || paymentLink.long_url || '',
    squareOrderId: paymentLink.order_id || ''
  };
}

export async function deleteSquarePaymentLink(paymentLinkId) {
  if (!paymentLinkId || !isSquareConfigured()) return;
  try {
    await squareRequest(`/v2/online-checkout/payment-links/${paymentLinkId}`, { method: 'DELETE' });
  } catch {
    // best effort
  }
}

export async function retrieveSquareOrder(orderId) {
  if (!orderId || !isSquareConfigured()) return null;
  try {
    const data = await squareRequest(`/v2/orders/${orderId}`);
    return data?.order || null;
  } catch {
    return null;
  }
}

export function verifySquareWebhookSignature({
  signature,
  rawBody,
  notificationUrl
}) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!signatureKey || !signature || !notificationUrl) return false;
  const expected = crypto
    .createHmac('sha256', signatureKey)
    .update(notificationUrl + rawBody)
    .digest('base64');

  const actualBuf = Buffer.from(String(signature));
  const expectedBuf = Buffer.from(String(expected));
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}
