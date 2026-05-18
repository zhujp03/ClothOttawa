import {
  renderHeader,
  getCustomerSession,
  getCartItems,
  getCheckoutItems,
  refreshCartPricing,
  cartSummary,
  clearCart,
  request,
  formatPrice,
  t
} from './common.js';

function shippingFromCustomer(customer) {
  return {
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    addressLine1: customer?.addressLine1 || '',
    addressLine2: customer?.addressLine2 || '',
    city: customer?.city || '',
    province: customer?.province || '',
    postalCode: customer?.postalCode || '',
    country: customer?.country || 'Canada'
  };
}

function formatRatePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Number(n.toFixed(3)).toString();
}

function orderSummaryHtml(items, summary, quote) {
  const taxCents = Number(quote?.taxCents || 0);
  const estimatedTotal = Number(summary.subtotalCents || 0) + taxCents;
  const ratePct = formatRatePct(quote?.effectiveRatePct ?? 0);
  return `
    <aside class="card-like cart-summary">
      <h2>${t('order_summary')}</h2>
      <div class="cart-page-list checkout-mini-list">
        ${items
          .map(
            (item) =>
              `<div class="summary-row"><span>${item.name} (${item.color}/${item.size}) x ${item.quantity}</span><strong>${formatPrice(item.priceCents * item.quantity)}</strong></div>`
          )
          .join('')}
      </div>
      <div class="summary-row"><span>${t('subtotal')}</span><strong>${formatPrice(summary.subtotalCents)}</strong></div>
      <div class="summary-row"><span>Tax (${ratePct}%)</span><strong>${formatPrice(taxCents)}</strong></div>
      <div class="summary-row total"><span>${t('estimated_total')}</span><strong>${formatPrice(estimatedTotal)}</strong></div>
    </aside>
  `;
}

function paymentMethodHtml() {
  return `
    <fieldset class="payment-method-fieldset">
      <legend>${t('payment_method')}</legend>
      <label class="payment-method-option">
        <input type="radio" name="paymentMethod" value="SQUARE" checked />
        <span>${t('pay_with_square')}</span>
      </label>
      <label class="payment-method-option">
        <input type="radio" name="paymentMethod" value="ETRANSFER" />
        <span>${t('pay_with_etransfer')} <strong class="payment-preferred-tag">${t('preferred_method')}</strong></span>
      </label>
      <p class="checkout-subline">${t('payment_method_hint')}</p>
    </fieldset>
  `;
}

function hasCompleteShippingProfile(customer) {
  return Boolean(
    customer?.firstName &&
      customer?.lastName &&
      customer?.phone &&
      customer?.addressLine1 &&
      customer?.city &&
      customer?.province &&
      customer?.postalCode &&
      customer?.country
  );
}

function formatRemain(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return '00:00';
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function renderPaymentStatusMode(root, token, paymentSessionToken) {
  root.innerHTML = `
    <section class="checkout-page">
      <div class="card-like checkout-success" id="payment-status-card">
        <h1>${t('finalizing_payment')}</h1>
        <p class="checkout-subline" id="payment-subline">${t('verify_payment_wait')}</p>
        <p id="payment-status-line">${t('checking_payment_status')}</p>
        <p id="payment-error" class="admin-error" style="display:none;"></p>
        <div class="checkout-success-actions" id="payment-actions"></div>
      </div>
    </section>
  `;

  const statusLine = document.querySelector('#payment-status-line');
  const subline = document.querySelector('#payment-subline');
  const errorBox = document.querySelector('#payment-error');
  const actions = document.querySelector('#payment-actions');

  let pollTimer = null;

  async function refreshStatus() {
    errorBox.style.display = 'none';
    try {
      const data = await request(`/api/orders/payment-session/${encodeURIComponent(paymentSessionToken)}/status`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.status === 'PAID' && data.order) {
        clearCart();
        statusLine.textContent = t('payment_confirmed_order', { orderNumber: data.order.orderNumber });
        const extraTip =
          data.paymentMethod === 'ETRANSFER'
            ? `<p class="checkout-subline"><strong>${t('etransfer_screenshot_tip')}</strong></p>`
            : '';
        actions.innerHTML = `
          ${extraTip}
          <a href="/orders" class="cart-view-btn">${t('view_my_orders')}</a>
          <a href="/shop" class="header-pill">${t('continue_shopping_caps')}</a>
        `;
        if (pollTimer) clearInterval(pollTimer);
        return;
      }

      if (data.status === 'PENDING') {
        if (data.paymentMethod === 'ETRANSFER') {
          if (subline) subline.textContent = t('verify_etransfer_wait');
          const recipientText = data.etransferRecipient
            ? t('etransfer_send_to_bold', { email: `<strong>${data.etransferRecipient}</strong>` })
            : t('etransfer_send_prompt');
          const monitorText = data.etransferMonitorConfigured
            ? ''
            : `<p class="admin-error etransfer-warning">${t('etransfer_monitor_not_ready')}</p>`;
          statusLine.textContent = t('etransfer_waiting_match', { remain: formatRemain(data.expiresAt) });
          actions.innerHTML = `
            <p class="checkout-subline">${recipientText}</p>
            <p class="checkout-subline"><strong>${t('etransfer_exact_payable_amount', { amount: formatPrice(data.totalCents) })}</strong></p>
            <p class="checkout-subline">${t('etransfer_exact_amount')}</p>
            ${monitorText}
            <button id="cancel-session-btn" class="danger-ghost" type="button">${t('cancel_payment_release')}</button>
          `;
        } else {
          if (subline) subline.textContent = t('verify_payment_wait');
          statusLine.textContent = t('payment_pending_release', { remain: formatRemain(data.expiresAt) });
          actions.innerHTML = `
            ${data.checkoutUrl ? `<a class="cart-view-btn" href="${data.checkoutUrl}" rel="noopener">${t('continue_payment_page')}</a>` : ''}
            <button id="cancel-session-btn" class="danger-ghost" type="button">${t('cancel_payment_release')}</button>
          `;
        }

        document.querySelector('#cancel-session-btn')?.addEventListener('click', async () => {
          try {
            await request(`/api/orders/payment-session/${encodeURIComponent(paymentSessionToken)}/cancel`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
            await refreshStatus();
          } catch (error) {
            errorBox.textContent = error.message || t('failed_cancel_payment_session');
            errorBox.style.display = 'block';
          }
        });
        return;
      }

      if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(data.status)) {
        const label = data.status === 'EXPIRED' ? 'expired' : data.status.toLowerCase();
        statusLine.textContent = t('payment_session_done', { label });
        actions.innerHTML = `<a href="/cart" class="cart-view-btn">${t('back_to_cart')}</a>`;
        if (pollTimer) clearInterval(pollTimer);
        return;
      }

      statusLine.textContent = t('current_session_status', { status: data.status });
    } catch (error) {
      errorBox.textContent = error.message || t('failed_check_payment_status');
      errorBox.style.display = 'block';
    }
  }

  await refreshStatus();
  pollTimer = setInterval(refreshStatus, 5000);
}

async function renderCheckoutFormMode(root, token, customer) {
  await refreshCartPricing().catch(() => {});
  const allItems = getCartItems();
  const items = getCheckoutItems(allItems);
  const summary = cartSummary(items);
  const hasDiscontinued = allItems.some((item) => item.isActive === false);

  if (allItems.length === 0) {
    root.innerHTML = `<section class="checkout-page"><div class="card-like"><h1>${t('cart_empty')}</h1><a href="/shop" class="cart-view-btn">${t('browse_products')}</a></div></section>`;
    return;
  }
  if (items.length === 0) {
    root.innerHTML = `
      <section class="checkout-page">
        <div class="card-like">
          <h1>${t('checkout_none_selected')}</h1>
          <a href="/cart" class="cart-view-btn">${t('back_to_cart')}</a>
        </div>
      </section>
    `;
    return;
  }

  if (hasDiscontinued) {
    root.innerHTML = `
      <section class="checkout-page">
        <div class="card-like">
          <h1>${t('checkout_blocked_discontinued')}</h1>
          <p class="checkout-subline">${t('product_discontinued')}</p>
          <a href="/cart" class="cart-view-btn">${t('back_to_cart')}</a>
        </div>
      </section>
    `;
    return;
  }

  if (!hasCompleteShippingProfile(customer)) {
    root.innerHTML = `
      <section class="checkout-page">
        <div class="card-like">
          <h1>${t('shipping_details_missing_title')}</h1>
          <p class="checkout-subline">${t('shipping_details_missing_desc')}</p>
          <a href="/account" class="cart-view-btn">${t('go_to_account_profile')}</a>
        </div>
      </section>
    `;
    return;
  }

  let taxQuote = null;
  try {
    taxQuote = await request('/api/tax/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country: customer.country,
        region: customer.province,
        subtotalCents: summary.subtotalCents
      })
    });
  } catch {
    taxQuote = { taxCents: 0 };
  }

  root.innerHTML = `
    <section class="checkout-page">
      <div class="checkout-grid">
        <form class="card-like checkout-form" id="checkout-form">
          <h1>${t('payment_method')}</h1>
          <p class="checkout-subline">${t('stock_reserved_15min')}</p>
          <p id="checkout-error" class="admin-error" style="display:none;"></p>
          ${paymentMethodHtml()}
          <button type="submit" id="continue-payment-btn">${t('continue_secure_payment')}</button>
        </form>
        <div id="checkout-summary-wrap">${orderSummaryHtml(items, summary, taxQuote)}</div>
      </div>
    </section>
  `;

  document.querySelector('#checkout-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = document.querySelector('#checkout-error');
    const submitBtn = document.querySelector('#continue-payment-btn');
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = t('creating_secure_payment');

    const formData = new FormData(event.currentTarget);
    const payload = {
      items: items.map((item) => ({
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: item.quantity
      })),
      shipping: shippingFromCustomer(customer)
    };
    payload.paymentMethod = String(formData.get('paymentMethod') || 'SQUARE').toUpperCase();

    try {
      const session = await request('/api/orders/payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (session.paymentMethod === 'SQUARE') {
        if (!session.checkoutUrl) {
          throw new Error(t('payment_link_unavailable'));
        }
        window.location.replace(session.checkoutUrl);
        return;
      }

      window.location.replace(`/checkout?paymentSession=${encodeURIComponent(session.token)}`);
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('404')) {
        errorBox.textContent =
          t('checkout_api_404');
      } else {
        errorBox.textContent = error.message || t('failed_continue_payment');
      }
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = t('continue_secure_payment');
    }
  });
}

async function init() {
  await renderHeader();
  const root = document.querySelector('#checkout-root');
  if (!root) return;

  const { token, customer } = getCustomerSession();

  if (!token || !customer) {
    root.innerHTML = `<section class="checkout-page"><div class="card-like"><h1>${t('login_required')}</h1><p>${t('login_before_checkout')}</p><a href="/account/login" class="cart-view-btn">${t('go_to_login')}</a></div></section>`;
    return;
  }

  const params = new URLSearchParams(location.search);
  const paymentSessionToken = String(params.get('paymentSession') || '').trim();

  if (paymentSessionToken) {
    await renderPaymentStatusMode(root, token, paymentSessionToken);
    return;
  }

  await renderCheckoutFormMode(root, token, customer);
}

init();
