import { renderHeader, request, publicImageUrl, formatPrice, t, getCustomerSession } from './common.js';

function productPriceMarkup(product, { compact = false } = {}) {
  const current = Number(product.currentPriceCents || product.priceCents || 0);
  const original = Number(product.priceCents || 0);
  const discount = Number(product.discountPercent || 0);
  if (!product.isOnSale || !product.salePriceCents || current >= original) {
    return `<strong class="product-price">${formatPrice(original)}</strong>`;
  }
  return `
    <div class="sale-price-stack ${compact ? 'compact' : ''}">
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
  const root = document.querySelector('#home-root');
  if (!root) return;
  const { customer } = getCustomerSession();

  const [{ items: newItems }, { items: trendingItems }, { items: topRatedItems }, categoryTree] = await Promise.all([
    request('/api/products?limit=100&sort=price_desc&recentDays=30').catch(() => ({ items: [] })),
    request('/api/products?limit=4&onSale=1&sort=price_desc').catch(() => ({ items: [] })),
    request('/api/products?sort=price_desc&limit=2').catch(() => ({ items: [] })),
    request('/api/categories?tree=1').catch(() => [])
  ]);

  const featured = Array.isArray(newItems) ? newItems[0] : null;
  const topRated = Array.isArray(topRatedItems) ? topRatedItems.slice(0, 2) : [];
  const trending = (Array.isArray(trendingItems) ? trendingItems : []).slice(0, 4);

  root.innerHTML = `
    <section class="storefront-section home-shell">
      ${
        !customer
          ? `<div class="home-auth-bar">
              <a href="/account/login" class="home-auth-btn">${t('header_log_in')}</a>
              <a href="/account/register" class="home-auth-btn home-auth-btn-primary">${t('header_sign_up')}</a>
            </div>`
          : ''
      }
      <div class="home-announcement">${t('member_access_banner')}</div>
      ${
        featured
          ? `
        <article class="home-hero-card">
          <img src="${publicImageUrl(featured.imageUrl)}" alt="${featured.name}" class="home-hero-image" />
          <div class="home-hero-content">
            <p class="hero-kicker">${t('just_landed')}</p>
            <h1>${featured.name}</h1>
            <p>${featured.description}</p>
            <div class="home-hero-price">${productPriceMarkup(featured)}</div>
            <div class="home-hero-actions">
              <a href="/product/${featured.id}" class="home-primary-btn">${t('shop_featured')}</a>
              <a href="/shop?recentDays=30" class="home-secondary-btn">${t('shop_new')}</a>
            </div>
          </div>
        </article>
      `
          : ''
      }
      <section class="home-root-nav">
        <a href="/shop" class="home-root-pill">${t('cart_shop_all')}</a>
        ${categoryTree.map((category) => `<a href="/category/${category.slug}" class="home-root-pill">${category.name}</a>`).join('')}
      </section>
      <section class="home-products-section">
        <div class="home-section-head">
          <h2>Top Rated Products</h2>
        </div>
        <div class="home-campaign-grid">
          ${topRated
            .map(
              (product) => `
            <article class="home-campaign-card">
              <img src="${publicImageUrl(product.imageUrl)}" alt="${product.name}" class="home-campaign-image" />
              <div class="home-campaign-overlay">
                <div class="home-campaign-price">${productPriceMarkup(product, { compact: true })}</div>
                <h3>${product.name}</h3>
                <a href="/product/${product.id}">${t('shop_now')}</a>
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </section>
      <section class="home-products-section">
        <div class="home-section-head">
          <p class="hero-kicker">ON SALE</p>
          <h2>Best Sale Picks</h2>
        </div>
        <div class="product-grid home-product-grid">
          ${trending.map(productCard).join('')}
        </div>
      </section>
    </section>
  `;
}

init();
