import { renderHeader, request, publicImageUrl, formatPrice, initCustomSelects, t } from './common.js';

function productPriceMarkup(product) {
  const current = Number(product.currentPriceCents || product.priceCents || 0);
  const original = Number(product.priceCents || 0);
  const discount = Number(product.discountPercent || 0);
  if (!product.isOnSale || !product.salePriceCents || current >= original) {
    return `<strong class="product-price">${formatPrice(original)}</strong>`;
  }
  return `
    <div class="sale-price-stack compact">
      <span class="price-original">${formatPrice(original)}</span>
      <span class="price-current-row"><span class="price-current">${formatPrice(current)}</span><span class="price-discount">-${discount}%</span></span>
    </div>
  `;
}

function productCard(product) {
  const totalStock = (product.variants || []).reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  return `
    <article class="product-card">
      <a href="/product/${product.id}" class="product-image-wrap">
        <img src="${publicImageUrl(product.imageUrl)}" alt="${product.name}" class="product-image" />
      </a>
      <div class="product-body">
        <p class="product-meta">${product.category?.name || t('uncategorized')}</p>
        <h3 class="product-title"><a href="/product/${product.id}">${product.name}</a></h3>
        <div class="product-row">
          ${productPriceMarkup(product)}
          <span class="stock-badge ${totalStock > 0 ? 'in-stock' : 'out-stock'}">${totalStock > 0 ? `${t('stock')} ${totalStock}` : t('sold_out')}</span>
        </div>
      </div>
    </article>
  `;
}

async function init() {
  await renderHeader();
  const app = document.querySelector('#shop-root');
  if (!app) return;

  const query = new URLSearchParams(location.search);
  const sort = query.get('sort') || 'latest';
  const search = query.get('search') || '';
  const onSale = query.get('onSale') === '1' ? '1' : '0';
  const recentDays = Number.parseInt(query.get('recentDays') || '0', 10);
  const recentDaysQuery = Number.isFinite(recentDays) && recentDays > 0 ? `&recentDays=${recentDays}` : '';
  const searchQuery = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
  const onSaleQuery = onSale === '1' ? '&onSale=1' : '';
  const data = await request(
    `/api/products?limit=100&sort=${encodeURIComponent(sort)}${recentDaysQuery}${searchQuery}${onSaleQuery}`
  ).catch(() => ({ items: [] }));
  const isNewCollection = Number.isFinite(recentDays) && recentDays > 0;
  const isOnSaleCollection = onSale === '1';
  const searchOpen = Boolean(search.trim());

  app.innerHTML = `
    <section class="storefront-section">
      <div class="page-heading-row">
        <p class="hero-kicker">${isOnSaleCollection ? 'ON SALE' : isNewCollection ? t('new_collection') : t('shop_all_kicker')}</p>
        <h1>${isOnSaleCollection ? t('shop_on_sale') : isNewCollection ? t('shop_new') : t('all_products')}</h1>
        <p>${t('products_available', { count: data.items.length })}</p>
      </div>
      <form class="shop-filters shop-filters-lite mobile-sort-search" method="get" id="shop-filter-form">
        ${onSale === '1' ? '<input type="hidden" name="onSale" value="1" />' : ''}
        ${
          Number.isFinite(recentDays) && recentDays > 0
            ? `<input type="hidden" name="recentDays" value="${recentDays}" />`
            : ''
        }
        <div class="filter-item">
          <label for="shop-sort-input">${t('sort')}</label>
          <div class="custom-select" data-custom-select>
            <input id="shop-sort-input" type="hidden" name="sort" value="${sort}" data-select-input />
            <button type="button" class="custom-select-trigger" data-select-trigger data-value="${sort}" aria-haspopup="listbox" aria-expanded="false"></button>
            <div class="custom-select-menu" data-select-menu role="listbox" aria-label="${t('sort')}">
              <button type="button" class="custom-select-option" data-select-option data-value="latest" aria-selected="false">${t('newest')}</button>
              <button type="button" class="custom-select-option" data-select-option data-value="price_asc" aria-selected="false">${t('price_low_high')}</button>
              <button type="button" class="custom-select-option" data-select-option data-value="price_desc" aria-selected="false">${t('price_high_low')}</button>
            </div>
          </div>
        </div>
        <div class="mobile-filter-actions">
          <button class="filter-submit mobile-half-btn" type="submit">${t('apply')}</button>
          <button class="mobile-search-toggle mobile-half-btn" type="button" id="shop-mobile-search-toggle" aria-expanded="${
            searchOpen ? 'true' : 'false'
          }" aria-controls="shop-mobile-search-row" title="${t('search')}">🔍</button>
        </div>
        <div class="mobile-search-row ${searchOpen ? 'is-open' : ''}" id="shop-mobile-search-row">
          <label for="shop-search-input">${t('search')}</label>
          <div class="mobile-search-controls">
            <input id="shop-search-input" type="text" name="search" value="${search.replaceAll('"', '&quot;')}" placeholder="${
              t('search')
            }..." />
            <button class="filter-submit mobile-search-action-btn" type="submit">${t('search')}</button>
            <button class="danger-ghost mobile-search-action-btn" type="button" id="shop-mobile-search-cancel">${t('cancel')}</button>
          </div>
        </div>
      </form>
      <div class="product-grid">${data.items.map(productCard).join('')}</div>
    </section>
  `;

  initCustomSelects(app);

  const toggle = document.querySelector('#shop-mobile-search-toggle');
  const row = document.querySelector('#shop-mobile-search-row');
  const cancel = document.querySelector('#shop-mobile-search-cancel');
  const searchInput = document.querySelector('#shop-search-input');
  const form = document.querySelector('#shop-filter-form');

  toggle?.addEventListener('click', () => {
    if (!row) return;
    const open = row.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) searchInput?.focus();
  });

  cancel?.addEventListener('click', () => {
    if (!form) return;
    const next = new URLSearchParams(location.search);
    next.delete('search');
    const qs = next.toString();
    location.href = `/shop${qs ? `?${qs}` : ''}`;
  });
}

init();
