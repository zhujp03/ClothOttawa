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

function collectDescendantIds(categories, rootId) {
  const childrenByParent = new Map();
  categories.forEach((category) => {
    const key = category.parentId || null;
    const list = childrenByParent.get(key) || [];
    list.push(category);
    childrenByParent.set(key, list);
  });
  const result = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop();
    result.push(current);
    (childrenByParent.get(current) || []).forEach((child) => stack.push(child.id));
  }
  return result;
}

async function init() {
  await renderHeader();
  const app = document.querySelector('#category-root');
  if (!app) return;

  const slug = location.pathname.split('/').filter(Boolean).pop();
  const query = new URLSearchParams(location.search);
  const sort = query.get('sort') || 'latest';
  const search = query.get('search') || '';
  const categories = await request('/api/categories').catch(() => []);
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    app.innerHTML = `<section class="storefront-section"><h1>${t('category_not_found')}</h1><a class="inline-link" href="/">${t('back_home')}</a></section>`;
    return;
  }

  const ids = collectDescendantIds(categories, category.id);
  const searchQuery = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
  const responses = await Promise.all(
    ids.map((id) => request(`/api/products?categoryId=${id}&limit=100${searchQuery}`).catch(() => ({ items: [] })))
  );
  const map = new Map();
  responses.forEach((response) => (response.items || []).forEach((product) => map.set(product.id, product)));
  const products = [...map.values()].sort((a, b) => {
    if (sort === 'price_asc') return Number(a.priceCents || 0) - Number(b.priceCents || 0);
    if (sort === 'price_desc') return Number(b.priceCents || 0) - Number(a.priceCents || 0);
    return Number(b.id) - Number(a.id);
  });

  app.innerHTML = `
    <section class="storefront-section">
      <div class="page-heading-row">
        <p class="hero-kicker">${t('category_kicker')}</p>
        <h1>${category.name}</h1>
        <p>${t('products_available', { count: products.length })}</p>
      </div>
      ${
        category.parentId
          ? `<form class="category-sort-filter mobile-sort-search" method="get" id="category-filter-form">
              <label for="category-sort-input">${t('sort')}</label>
              <div class="custom-select" data-custom-select>
                <input id="category-sort-input" type="hidden" name="sort" value="${sort}" data-select-input />
                <button type="button" class="custom-select-trigger" data-select-trigger data-value="${sort}" aria-haspopup="listbox" aria-expanded="false"></button>
                <div class="custom-select-menu" data-select-menu role="listbox" aria-label="${t('sort')}">
                  <button type="button" class="custom-select-option" data-select-option data-value="latest" aria-selected="false">${t('newest')}</button>
                  <button type="button" class="custom-select-option" data-select-option data-value="price_asc" aria-selected="false">${t('price_low_high')}</button>
                  <button type="button" class="custom-select-option" data-select-option data-value="price_desc" aria-selected="false">${t('price_high_low')}</button>
                </div>
              </div>
              <div class="mobile-filter-actions">
                <button class="filter-submit mobile-half-btn" type="submit">${t('apply')}</button>
                <button class="mobile-search-toggle mobile-half-btn" type="button" id="category-mobile-search-toggle" aria-expanded="${
                  search.trim() ? 'true' : 'false'
                }" aria-controls="category-mobile-search-row" title="${t('search')}">🔍</button>
              </div>
              <div class="mobile-search-row ${search.trim() ? 'is-open' : ''}" id="category-mobile-search-row">
                <label for="category-search-input">${t('search')}</label>
                <div class="mobile-search-controls">
                  <input id="category-search-input" type="text" name="search" value="${search.replaceAll('"', '&quot;')}" placeholder="${t(
              'search'
            )}..." />
                  <button class="filter-submit mobile-search-action-btn" type="submit">${t('search')}</button>
                  <button class="danger-ghost mobile-search-action-btn" type="button" id="category-mobile-search-cancel">${t('cancel')}</button>
                </div>
              </div>
            </form>`
          : ''
      }
      <div class="product-grid">${products.map(productCard).join('')}</div>
    </section>
  `;

  initCustomSelects(app);

  const toggle = document.querySelector('#category-mobile-search-toggle');
  const row = document.querySelector('#category-mobile-search-row');
  const cancel = document.querySelector('#category-mobile-search-cancel');
  const searchInput = document.querySelector('#category-search-input');

  toggle?.addEventListener('click', () => {
    if (!row) return;
    const open = row.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) searchInput?.focus();
  });

  cancel?.addEventListener('click', () => {
    const next = new URLSearchParams(location.search);
    next.delete('search');
    const qs = next.toString();
    location.href = `/category/${slug}${qs ? `?${qs}` : ''}`;
  });
}

init();
