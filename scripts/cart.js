import {
  renderHeader,
  getCartItems,
  getCheckoutItems,
  updateCartQuantity,
  removeCartItem,
  setCartItemSelected,
  clearCart,
  cartSummary,
  formatPrice,
  publicImageUrl,
  makeLineKey,
  refreshCartPricing,
  t
} from './common.js';

async function init() {
  await renderHeader();
  await refreshCartPricing().catch(() => {});
  const root = document.querySelector('#cart-root');
  if (!root) return;

  function rerender() {
    const items = getCartItems();
    const checkoutItems = getCheckoutItems(items);
    const summary = cartSummary(checkoutItems);
    const hasDiscontinued = items.some((item) => item.isActive === false);
    const hasNoSelected = checkoutItems.length === 0;

    if (items.length === 0) {
      root.innerHTML = `
        <section class="cart-page">
          <div class="cart-empty card-like">
            <h1>${t('cart_empty')}</h1>
            <p>${t('browse_add_continue')}</p>
            <a href="/shop" class="cart-view-btn">${t('start_shopping')}</a>
          </div>
        </section>
      `;
      return;
    }

    root.innerHTML = `
      <section class="cart-page">
        <div class="cart-page-grid">
          <div class="card-like">
            <div class="cart-page-head">
              <h1>${t('cart_items')}</h1>
              <button type="button" class="ghost-btn" id="clear-cart-btn">${t('cart_clear')}</button>
            </div>
            <div class="cart-page-list">
              ${items
                .map(
                  (item) => `
                <article class="cart-item">
                  <label class="cart-select-check">
                    <input type="checkbox" data-action="toggle-select" data-key="${makeLineKey(item)}" ${
                      item.selected !== false && item.isActive !== false ? 'checked' : ''
                    } ${item.isActive === false ? 'disabled' : ''} />
                    <span>${t('select_for_checkout')}</span>
                  </label>
                  <img src="${publicImageUrl(item.imageUrl)}" alt="${item.name}" class="cart-item-image" />
                  <div class="cart-item-content">
                    <h4>${item.name}</h4>
                    <p>${item.color} / ${item.size}</p>
                    <p class="cart-muted">${t('unit_price')}: ${formatPrice(item.priceCents)}</p>
                    ${item.isActive === false ? `<p class="admin-error">${t('product_discontinued')}</p>` : ''}
                    <div class="cart-item-actions">
                      <div class="qty-control">
                        <button data-action="minus" data-key="${makeLineKey(item)}">-</button>
                        <span>${item.quantity}</span>
                        <button data-action="plus" data-key="${makeLineKey(item)}">+</button>
                      </div>
                      <button class="danger-ghost" data-action="remove" data-key="${makeLineKey(item)}">${t('cart_remove')}</button>
                    </div>
                  </div>
                  <strong class="cart-line-total">${formatPrice(Number(item.priceCents || 0) * Number(item.quantity || 1))}</strong>
                </article>
              `
                )
                .join('')}
            </div>
          </div>
          <aside class="card-like cart-summary">
            <h2>${t('order_summary')}</h2>
            <div class="summary-row"><span>${t('checkout_selected_subtotal')}</span><strong>${formatPrice(summary.subtotalCents)}</strong></div>
            <div class="summary-row"><span>${t('shipping')}</span><span>${t('calculated_checkout')}</span></div>
            <div class="summary-row total"><span>${t('total')}</span><strong>${formatPrice(summary.subtotalCents)}</strong></div>
            ${hasDiscontinued ? `<p class="admin-error">${t('checkout_blocked_discontinued')}</p>` : ''}
            ${hasNoSelected ? `<p class="admin-error">${t('checkout_none_selected')}</p>` : ''}
            <a href="/checkout" class="cta-button checkout-btn ${hasDiscontinued || hasNoSelected ? 'is-disabled' : ''}" data-checkout-guard="${
              hasDiscontinued || hasNoSelected ? '1' : '0'
            }" aria-disabled="${hasDiscontinued || hasNoSelected ? 'true' : 'false'}">${t('proceed_checkout')}</a>
            <a href="/" class="inline-link">${t('continue_shopping')}</a>
          </aside>
        </div>
      </section>
    `;

    document.querySelector('#clear-cart-btn')?.addEventListener('click', () => {
      clearCart();
      rerender();
    });

    document.querySelectorAll('[data-action="remove"]').forEach((button) => {
      button.addEventListener('click', () => {
        removeCartItem(button.dataset.key || '');
        rerender();
      });
    });

    document.querySelectorAll('[data-action="minus"]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.key || '';
        const item = getCartItems().find((entry) => makeLineKey(entry) === key);
        if (!item) return;
        updateCartQuantity(key, Math.max(1, Number(item.quantity || 1) - 1));
        rerender();
      });
    });

    document.querySelectorAll('[data-action="plus"]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.key || '';
        const item = getCartItems().find((entry) => makeLineKey(entry) === key);
        if (!item) return;
        updateCartQuantity(key, Number(item.quantity || 1) + 1);
        rerender();
      });
    });

    document.querySelectorAll('[data-action="toggle-select"]').forEach((input) => {
      input.addEventListener('change', () => {
        const key = input.dataset.key || '';
        setCartItemSelected(key, Boolean(input.checked));
        rerender();
      });
    });

    document.querySelectorAll('[data-checkout-guard="1"]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
      });
    });
  }

  rerender();
}

init();
