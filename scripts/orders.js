import { renderHeader, request, getCustomerSession, formatPrice, t, getLocale } from './common.js';

function formatDate(value) {
  if (!value) return '-';
  const locale = getLocale() === 'fr' ? 'fr-CA' : 'en-CA';
  return new Date(value).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function shippingText(order) {
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    return order.trackingNumber ? t('tracking_number', { number: order.trackingNumber }) : t('tracking_number_missing');
  }
  return t('preparing_shipping');
}

function statusText(status) {
  const value = String(status || '').toUpperCase();
  const en = {
    PLACED: 'Placed',
    PAID: 'Paid',
    PACKING: 'Packing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
  };
  const fr = {
    PLACED: 'Passée',
    PAID: 'Payée',
    PACKING: 'Préparation',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée'
  };
  return getLocale() === 'fr' ? fr[value] || value : en[value] || value;
}

function orderListHtml(orders = []) {
  if (!orders.length) return `<p class="empty-state">${t('no_orders_found')}</p>`;
  return `
    <div class="order-list">
      ${orders
        .map(
          (order) => `
        <article class="order-card">
          <div class="order-head">
            <div>
              <h3>${order.orderNumber}</h3>
              <p>${formatDate(order.createdAt)}</p>
            </div>
            <span class="status-pill ${String(order.status).toLowerCase()}">${statusText(order.status)}</span>
          </div>
          <div class="order-items">
            ${(order.items || [])
              .map((item) => `<p>${item.productName} (${item.color}/${item.size}) x ${item.quantity}</p>`)
              .join('')}
          </div>
          <div class="table-subline">${shippingText(order)}</div>
          <div class="order-total">${t('total')}: ${formatPrice(order.totalCents)}</div>
        </article>
      `
        )
        .join('')}
    </div>
  `;
}

async function init() {
  await renderHeader();
  const root = document.querySelector('#orders-root');
  if (!root) return;

  root.innerHTML = `
    <section class="account-page">
      <div class="panel">
        <h2>${t('my_orders')}</h2>
        <p class="checkout-subline">${t('purchases_listed')}</p>
        <p id="orders-error" class="admin-error" style="display:none;"></p>
        <div id="orders-results"><p class="empty-state">${t('loading_orders')}</p></div>
      </div>
    </section>
  `;

  const { token, customer } = getCustomerSession();
  const errorNode = document.querySelector('#orders-error');
  const resultNode = document.querySelector('#orders-results');
  if (!errorNode || !resultNode) return;

  if (!token || !customer) {
    resultNode.innerHTML = `<p class="empty-state">${t('please_login_view_orders')}</p><p><a href="/account/login" class="cart-view-btn">${t('go_to_login')}</a></p>`;
    return;
  }

  try {
    const orders = await request('/api/orders/mine', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    resultNode.innerHTML = orderListHtml(orders);
  } catch (error) {
    errorNode.textContent = error.message || t('failed_load_orders');
    errorNode.style.display = 'block';
    resultNode.innerHTML = '';
  }
}

init();
