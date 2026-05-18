export function getPublicSiteBaseUrl() {
  const fromEnv =
    process.env.PUBLIC_SITE_URL ||
    process.env.APP_BASE_URL ||
    process.env.CHECKOUT_RETURN_BASE_URL ||
    '';

  const fallback = `http://localhost:${process.env.PORT || 4000}`;

  return String(fromEnv || fallback).replace(/\/$/, '');
}

async function sendResendEmail(payload) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const fromEmail = String(process.env.RESEND_FROM_EMAIL || '').trim();
  const fromName = String(process.env.RESEND_FROM_NAME || 'Luxury Cloth Inc.').trim();

  if (!apiKey || !fromEmail) {
    return {
      sent: false,
      reason: 'EMAIL_PROVIDER_NOT_CONFIGURED'
    };
  }

  const apiBase = String(process.env.RESEND_API_BASE_URL || 'https://api.resend.com').replace(/\/$/, '');
  const from = `${fromName} <${fromEmail}>`;

  try {
    const response = await fetch(`${apiBase}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        ...payload
      })
    });

    if (!response.ok) {
      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }

      return {
        sent: false,
        reason: 'EMAIL_SEND_FAILED',
        errorMessage: body?.message || `Resend request failed: ${response.status}`
      };
    }
  } catch (error) {
    return {
      sent: false,
      reason: 'EMAIL_SEND_FAILED',
      errorMessage: error?.message || 'Failed to send email'
    };
  }

  return {
    sent: true
  };
}

export async function sendCustomerVerificationEmail({
  email,
  firstName,
  verifyToken
}) {
  const baseUrl = getPublicSiteBaseUrl();
  const verifyUrl = `${baseUrl}/account/verify-email?token=${encodeURIComponent(verifyToken)}`;

  const payload = {
    to: [email],
    subject: 'Verify your email | Luxury Station',
    text: `Hi ${firstName || ''}, please verify your email by opening this link: ${verifyUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2328;">
        <h2 style="margin:0 0 12px;">Welcome to Luxury Station</h2>
        <p style="margin:0 0 12px;">Please verify your email to activate your account.</p>
        <p style="margin:0 0 18px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#0f7e79;color:#ffffff;text-decoration:none;border-radius:8px;">Verify Email</a>
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#5f6368;">If the button does not work, copy this link into your browser:</p>
        <p style="margin:0;font-size:13px;color:#0f7e79;word-break:break-all;">${verifyUrl}</p>
      </div>
    `
  };

  const result = await sendResendEmail(payload);
  if (!result.sent) {
    return {
      ...result,
      verifyUrl,
      errorMessage: result.errorMessage || 'Failed to send verification email'
    };
  }

  return {
    sent: true,
    verifyUrl
  };
}

export async function sendOrderPlacedEmail({
  email,
  firstName,
  orderNumber
}) {
  const baseUrl = getPublicSiteBaseUrl();
  const ordersUrl = `${baseUrl}/account`;

  const payload = {
    to: [email],
    subject: `Order placed | ${orderNumber}`,
    text: `Hi ${firstName || ''}, your order ${orderNumber} has been placed successfully. You can track shipping progress in your account: ${ordersUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2328;">
        <h2 style="margin:0 0 12px;">Your order is confirmed</h2>
        <p style="margin:0 0 12px;">Order number: <strong>${orderNumber}</strong></p>
        <p style="margin:0 0 14px;">Your order has been placed successfully. Please check delivery progress in your account center.</p>
        <p style="margin:0 0 18px;">
          <a href="${ordersUrl}" style="display:inline-block;padding:10px 16px;background:#0f7e79;color:#ffffff;text-decoration:none;border-radius:8px;">View My Orders</a>
        </p>
      </div>
    `
  };

  return sendResendEmail(payload);
}
