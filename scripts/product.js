import {
  renderHeader,
  request,
  publicImageUrl,
  formatPrice,
  addCartItem,
  getCustomerSession,
  openAuthGateModal,
  t
} from './common.js';

function productPriceMarkup(product) {
  const current = Number(product.currentPriceCents || product.priceCents || 0);
  const original = Number(product.priceCents || 0);
  const discount = Number(product.discountPercent || 0);
  if (!product.isOnSale || !product.salePriceCents || current >= original) {
    return `<p class="pdp-price">${formatPrice(original)}</p>`;
  }
  return `
    <div class="sale-price-stack pdp-sale-price">
      <span class="price-original">${formatPrice(original)}</span>
      <span class="price-current-row"><span class="price-current">${formatPrice(current)}</span><span class="price-discount">-${discount}%</span></span>
    </div>
  `;
}

function variantKey(color, size) {
  return `${String(color).trim().toLowerCase()}::${String(size).trim().toLowerCase()}`;
}

function normalizeVariants(variants = []) {
  return variants.map((variant) => ({
    color: String(variant.color || '').trim(),
    size: String(variant.size || '').trim(),
    stock: Number(variant.stock || 0),
    sku: String(variant.sku || '').trim()
  }));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isCoarsePointerDevice() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

async function init() {
  await renderHeader();
  const root = document.querySelector('#product-root');
  if (!root) return;

  const id = location.pathname.split('/').filter(Boolean).pop();
  let product = await request(`/api/products/${id}`).catch(() => null);

  if (!product) {
    root.innerHTML = `<section class="storefront-section"><h1>${t('product_not_found')}</h1><a class="inline-link" href="/">${t('back_home')}</a></section>`;
    return;
  }

  let variants = normalizeVariants(product.variants || []);
  let imageUrls = (Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls
    : [product.imageUrl]
  )
    .filter(Boolean)
    .map((url) => publicImageUrl(url));
  if (!imageUrls.length) {
    imageUrls.push(publicImageUrl(null));
  }
  let imageIndex = 0;
  let colors = [...new Set(variants.map((item) => item.color).filter(Boolean))];
  let sizes = [...new Set(variants.map((item) => item.size).filter(Boolean))];
  let selectedColor = colors[0] || '';
  let selectedSize = sizes[0] || '';

  function selectedVariant() {
    return variants.find((item) => variantKey(item.color, item.size) === variantKey(selectedColor, selectedSize));
  }

  function renderPicker() {
    const validSizes = new Set(
      variants.filter((item) => !selectedColor || item.color === selectedColor).map((item) => item.size)
    );
    const validColors = new Set(
      variants.filter((item) => !selectedSize || item.size === selectedSize).map((item) => item.color)
    );

    if (selectedSize && !validSizes.has(selectedSize)) selectedSize = [...validSizes][0] || '';
    if (selectedColor && !validColors.has(selectedColor)) selectedColor = [...validColors][0] || '';

    const selected = selectedVariant();
    const canAdd = Boolean(selected && selected.stock > 0);

    return `
      <div class="option-block">
        <h3>${t('colors')}</h3>
        <div class="chip-row">
          ${
            colors.length === 0
              ? `<span class="option-chip">${t('standard')}</span>`
              : colors
                  .map(
                    (color) =>
                      `<button class="option-chip option-chip-btn ${color === selectedColor ? 'active' : ''}" data-color="${color}" ${!validColors.has(color) ? 'disabled' : ''}>${color}</button>`
                  )
                  .join('')
          }
        </div>
      </div>
      <div class="option-block">
        <h3>${t('sizes')}</h3>
        <div class="chip-row">
          ${
            sizes.length === 0
              ? `<span class="option-chip">${t('one_size')}</span>`
              : sizes
                  .map(
                    (size) =>
                      `<button class="option-chip option-chip-btn ${size === selectedSize ? 'active' : ''}" data-size="${size}" ${!validSizes.has(size) ? 'disabled' : ''}>${size}</button>`
                  )
                  .join('')
          }
        </div>
      </div>
      ${
        selected
          ? `<p class="variant-status">${t('selected_variant', {
              color: selected.color,
              size: selected.size,
              stock: selected.stock,
              skuPart: selected.sku ? ` - SKU ${selected.sku}` : ''
            })}</p>`
          : ''
      }
      <button id="add-cart-btn" class="cta-button" ${canAdd ? '' : 'disabled'}>${canAdd ? t('add_to_cart') : t('sold_out_variant')}</button>
      <p id="variant-feedback" class="variant-feedback" style="display:none;"></p>
    `;
  }

  function mediaMarkup() {
    const canSlide = imageUrls.length > 1;
    return `
      <div class="pdp-media-wrap">
        <div class="pdp-carousel" aria-live="polite">
          <div class="pdp-carousel-track" id="pdp-carousel-track" style="transform: translateX(-${imageIndex * 100}%);">
            ${imageUrls
              .map((src, idx) => `<img src="${src}" alt="${product.name} image ${idx + 1}" class="pdp-image" />`)
              .join('')}
          </div>
          ${
            canSlide
              ? `<button type="button" class="pdp-arrow pdp-arrow-left" id="pdp-arrow-left" aria-label="Previous image">‹</button>
                 <button type="button" class="pdp-arrow pdp-arrow-right" id="pdp-arrow-right" aria-label="Next image">›</button>
                 <div class="pdp-carousel-dots">${imageUrls
                   .map(
                     (_src, idx) =>
                       `<button type="button" class="pdp-dot ${idx === imageIndex ? 'active' : ''}" data-img-index="${idx}" aria-label="View image ${idx + 1}"></button>`
                   )
                   .join('')}</div>`
              : ''
          }
        </div>
      </div>
    `;
  }

  root.innerHTML = `
    <section class="pdp-layout">
      ${mediaMarkup()}
      <article class="pdp-content">
        <p class="hero-kicker" id="pdp-category">${product.category?.name || t('product')}</p>
        <h1 id="pdp-name">${product.name}</h1>
        <div id="pdp-price-wrap">${productPriceMarkup(product)}</div>
        <p class="pdp-description" id="pdp-description">${product.description}</p>
        <div id="variant-picker"></div>
      </article>
    </section>
    ${
      product.introPdfUrl
        ? `<section class="pdp-intro-block">
            <h2>Product Introduction</h2>
            <div class="pdp-intro-doc">
              <a class="inline-link" href="${publicImageUrl(product.introPdfUrl)}" target="_blank" rel="noopener">Open product introduction PDF</a>
              <iframe class="pdp-intro-pdf" src="${publicImageUrl(product.introPdfUrl)}#view=FitH" title="Product introduction PDF"></iframe>
            </div>
          </section>`
        : ''
    }
  `;

  const lightboxMarkup = `
    <div class="pdp-lightbox" id="pdp-lightbox" hidden>
      <div class="pdp-lightbox-stage" id="pdp-lightbox-stage">
        <button type="button" class="pdp-lightbox-nav pdp-lightbox-nav-left" id="pdp-lightbox-prev" aria-label="Previous image">‹</button>
        <button type="button" class="pdp-lightbox-nav pdp-lightbox-nav-right" id="pdp-lightbox-next" aria-label="Next image">›</button>
        <button type="button" class="pdp-lightbox-close" id="pdp-lightbox-close" aria-label="Close image preview">×</button>
        <img src="" alt="" class="pdp-lightbox-image" id="pdp-lightbox-image" />
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', lightboxMarkup);

  const lightbox = document.querySelector('#pdp-lightbox');
  const lightboxStage = document.querySelector('#pdp-lightbox-stage');
  const lightboxImage = document.querySelector('#pdp-lightbox-image');
  const lightboxClose = document.querySelector('#pdp-lightbox-close');
  const lightboxPrev = document.querySelector('#pdp-lightbox-prev');
  const lightboxNext = document.querySelector('#pdp-lightbox-next');
  const lightboxState = {
    open: false,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    startPanX: 0,
    startPanY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    isPanning: false,
    pinchStartDistance: 0,
    pinchStartScale: 1,
    pinchCenterX: 0,
    pinchCenterY: 0,
    swipeStartX: 0,
    swipeStartY: 0
  };

  function updateLightboxNavigation() {
    const canSlide = imageUrls.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !canSlide;
    if (lightboxNext) lightboxNext.hidden = !canSlide;
  }

  function showLightboxImageByIndex(nextIndex) {
    if (!(lightboxImage && imageUrls.length)) return;
    imageIndex = (nextIndex + imageUrls.length) % imageUrls.length;
    lightboxImage.src = imageUrls[imageIndex];
    lightboxImage.alt = `${product.name} image ${imageIndex + 1}`;
    resetLightboxTransform();
    updateLightboxNavigation();
  }

  function applyLightboxTransform() {
    if (!lightboxImage) return;
    lightboxImage.style.transform = `translate(${lightboxState.offsetX}px, ${lightboxState.offsetY}px) scale(${lightboxState.scale})`;
  }

  function resetLightboxTransform() {
    lightboxState.scale = 1;
    lightboxState.offsetX = 0;
    lightboxState.offsetY = 0;
    lightboxState.startPanX = 0;
    lightboxState.startPanY = 0;
    lightboxState.startOffsetX = 0;
    lightboxState.startOffsetY = 0;
    lightboxState.isPanning = false;
    lightboxState.pinchStartDistance = 0;
    lightboxState.pinchStartScale = 1;
    applyLightboxTransform();
  }

  function closeLightbox() {
    if (!lightbox || !lightboxState.open) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lightboxState.open = false;
    resetLightboxTransform();
  }

  function openLightbox(src, altText) {
    if (!(lightbox && lightboxImage)) return;
    lightboxImage.src = src;
    lightboxImage.alt = altText || 'Product image preview';
    resetLightboxTransform();
    updateLightboxNavigation();
    lightbox.hidden = false;
    lightboxState.open = true;
    document.body.style.overflow = 'hidden';
  }

  function touchDistance(touchA, touchB) {
    const dx = touchA.clientX - touchB.clientX;
    const dy = touchA.clientY - touchB.clientY;
    return Math.hypot(dx, dy);
  }

  function touchCenter(touchA, touchB) {
    return {
      x: (touchA.clientX + touchB.clientX) / 2,
      y: (touchA.clientY + touchB.clientY) / 2
    };
  }

  function onLightboxTouchStart(event) {
    if (!lightboxState.open) return;
    if (event.touches.length === 2) {
      const [first, second] = event.touches;
      lightboxState.pinchStartDistance = touchDistance(first, second);
      lightboxState.pinchStartScale = lightboxState.scale;
      const center = touchCenter(first, second);
      lightboxState.pinchCenterX = center.x;
      lightboxState.pinchCenterY = center.y;
      lightboxState.isPanning = false;
      return;
    }
    if (event.touches.length === 1 && lightboxState.scale > 1) {
      const finger = event.touches[0];
      lightboxState.isPanning = true;
      lightboxState.startPanX = finger.clientX;
      lightboxState.startPanY = finger.clientY;
      lightboxState.startOffsetX = lightboxState.offsetX;
      lightboxState.startOffsetY = lightboxState.offsetY;
      return;
    }
    if (event.touches.length === 1) {
      const finger = event.touches[0];
      lightboxState.swipeStartX = finger.clientX;
      lightboxState.swipeStartY = finger.clientY;
    }
  }

  function onLightboxTouchMove(event) {
    if (!lightboxState.open) return;
    if (event.touches.length === 2) {
      event.preventDefault();
      const [first, second] = event.touches;
      const nextDistance = touchDistance(first, second);
      if (!lightboxState.pinchStartDistance) {
        lightboxState.pinchStartDistance = nextDistance;
        return;
      }
      const rawScale = lightboxState.pinchStartScale * (nextDistance / lightboxState.pinchStartDistance);
      lightboxState.scale = clamp(rawScale, 1, 4);
      if (lightboxState.scale <= 1) {
        lightboxState.offsetX = 0;
        lightboxState.offsetY = 0;
      }
      applyLightboxTransform();
      return;
    }
    if (event.touches.length === 1 && lightboxState.isPanning && lightboxState.scale > 1) {
      event.preventDefault();
      const finger = event.touches[0];
      const deltaX = finger.clientX - lightboxState.startPanX;
      const deltaY = finger.clientY - lightboxState.startPanY;
      const maxShift = 220 * (lightboxState.scale - 1);
      lightboxState.offsetX = clamp(lightboxState.startOffsetX + deltaX, -maxShift, maxShift);
      lightboxState.offsetY = clamp(lightboxState.startOffsetY + deltaY, -maxShift, maxShift);
      applyLightboxTransform();
    }
  }

  function onLightboxTouchEnd(event) {
    if (!lightboxState.open) return;
    if (event.touches.length === 0) {
      if (lightboxState.scale === 1 && !lightboxState.isPanning && imageUrls.length > 1) {
        const touch = event.changedTouches?.[0];
        if (touch) {
          const deltaX = touch.clientX - lightboxState.swipeStartX;
          const deltaY = touch.clientY - lightboxState.swipeStartY;
          if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) showLightboxImageByIndex(imageIndex + 1);
            else showLightboxImageByIndex(imageIndex - 1);
          }
        }
      }
      lightboxState.isPanning = false;
      lightboxState.pinchStartDistance = 0;
      lightboxState.pinchStartScale = lightboxState.scale;
      lightboxState.swipeStartX = 0;
      lightboxState.swipeStartY = 0;
      return;
    }
    if (event.touches.length === 1 && lightboxState.scale > 1) {
      const finger = event.touches[0];
      lightboxState.isPanning = true;
      lightboxState.startPanX = finger.clientX;
      lightboxState.startPanY = finger.clientY;
      lightboxState.startOffsetX = lightboxState.offsetX;
      lightboxState.startOffsetY = lightboxState.offsetY;
    }
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', (event) => {
    event.stopPropagation();
    showLightboxImageByIndex(imageIndex - 1);
  });
  lightboxNext?.addEventListener('click', (event) => {
    event.stopPropagation();
    showLightboxImageByIndex(imageIndex + 1);
  });
  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightboxStage?.addEventListener('touchstart', onLightboxTouchStart, { passive: false });
  lightboxStage?.addEventListener('touchmove', onLightboxTouchMove, { passive: false });
  lightboxStage?.addEventListener('touchend', onLightboxTouchEnd, { passive: false });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });

  function bindMediaEvents() {
    const track = document.querySelector('#pdp-carousel-track');
    if (!track) return;
    track.style.transform = `translateX(-${imageIndex * 100}%)`;

    const left = document.querySelector('#pdp-arrow-left');
    const right = document.querySelector('#pdp-arrow-right');
    left?.addEventListener('click', () => {
      imageIndex = (imageIndex - 1 + imageUrls.length) % imageUrls.length;
      track.style.transform = `translateX(-${imageIndex * 100}%)`;
      document.querySelectorAll('[data-img-index]').forEach((dot) => {
        dot.classList.toggle('active', Number(dot.dataset.imgIndex) === imageIndex);
      });
    });
    right?.addEventListener('click', () => {
      imageIndex = (imageIndex + 1) % imageUrls.length;
      track.style.transform = `translateX(-${imageIndex * 100}%)`;
      document.querySelectorAll('[data-img-index]').forEach((dot) => {
        dot.classList.toggle('active', Number(dot.dataset.imgIndex) === imageIndex);
      });
    });
    document.querySelectorAll('[data-img-index]').forEach((dot) => {
      dot.addEventListener('click', () => {
        imageIndex = Number(dot.dataset.imgIndex || 0);
        track.style.transform = `translateX(-${imageIndex * 100}%)`;
        document.querySelectorAll('[data-img-index]').forEach((other) => {
          other.classList.toggle('active', Number(other.dataset.imgIndex) === imageIndex);
        });
      });
    });

    const coarsePointer = isCoarsePointerDevice();
    document.querySelectorAll('.pdp-image').forEach((img, idx) => {
      if (coarsePointer) {
        img.addEventListener('click', () => {
          imageIndex = idx;
          openLightbox(imageUrls[idx], `${product.name} image ${idx + 1}`);
        });
        return;
      }

      img.addEventListener('mouseenter', () => {
        img.classList.add('is-zooming');
      });
      img.addEventListener('mousemove', (event) => {
        const rect = img.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
        img.style.transformOrigin = `${x}% ${y}%`;
        img.classList.add('is-zooming');
      });
      img.addEventListener('mouseleave', () => {
        img.classList.remove('is-zooming');
        img.style.transformOrigin = 'center center';
      });
    });
  }

  const picker = document.querySelector('#variant-picker');

  function bindPicker() {
    picker.innerHTML = renderPicker();
    picker.querySelectorAll('[data-color]').forEach((node) =>
      node.addEventListener('click', (event) => {
        event.preventDefault();
        selectedColor = node.dataset.color || '';
        bindPicker();
      })
    );
    picker.querySelectorAll('[data-size]').forEach((node) =>
      node.addEventListener('click', (event) => {
        event.preventDefault();
        selectedSize = node.dataset.size || '';
        bindPicker();
      })
    );
    const addBtn = document.querySelector('#add-cart-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const { token, customer } = getCustomerSession();
        if (!token || !customer) {
          openAuthGateModal(
            t('auth_gate_title'),
            t('auth_gate_message')
          );
          return;
        }
        const selected = selectedVariant();
        if (!selected || selected.stock <= 0) return;
        addCartItem(
          {
            productId: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            priceCents: Number(product.currentPriceCents || product.priceCents || 0),
            color: selected.color,
            size: selected.size,
            sku: selected.sku,
            stock: selected.stock
          },
          1
        );
        const feedback = document.querySelector('#variant-feedback');
        feedback.textContent = t('added_to_cart', { color: selected.color, size: selected.size });
        feedback.style.display = 'block';
        setTimeout(() => {
          feedback.style.display = 'none';
        }, 1800);
      });
    }
  }

  bindPicker();
  bindMediaEvents();

  function sameVariants(left = [], right = []) {
    if (left.length !== right.length) return false;
    const normalize = (rows) =>
      [...rows]
        .map((item) => ({
          color: String(item.color || '').trim().toLowerCase(),
          size: String(item.size || '').trim().toLowerCase(),
          stock: Number(item.stock || 0),
          sku: String(item.sku || '').trim().toLowerCase()
        }))
        .sort((a, b) => `${a.color}-${a.size}`.localeCompare(`${b.color}-${b.size}`));
    const a = normalize(left);
    const b = normalize(right);
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function sameImageList(left = [], right = []) {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (String(left[i] || '') !== String(right[i] || '')) return false;
    }
    return true;
  }

  async function refreshLiveProduct() {
    const latest = await request(`/api/products/${id}`).catch(() => null);
    if (!latest) {
      root.innerHTML = `
        <section class="storefront-section">
          <h1>${t('product_discontinued')}</h1>
          <a class="inline-link" href="/shop">${t('continue_shopping')}</a>
        </section>
      `;
      const liveTimer = window.__pdpLiveSyncTimers?.get(String(id));
      if (liveTimer) {
        window.clearInterval(liveTimer);
        window.__pdpLiveSyncTimers.delete(String(id));
      }
      return;
    }

    const latestVariants = normalizeVariants(latest.variants || []);
    const latestImages = (Array.isArray(latest.imageUrls) && latest.imageUrls.length > 0
      ? latest.imageUrls
      : [latest.imageUrl]
    )
      .filter(Boolean)
      .map((url) => publicImageUrl(url));
    if (!latestImages.length) latestImages.push(publicImageUrl(null));

    const priceChanged =
      Number(latest.currentPriceCents || latest.priceCents || 0) !== Number(product.currentPriceCents || product.priceCents || 0) ||
      Boolean(latest.isOnSale) !== Boolean(product.isOnSale) ||
      Number(latest.salePriceCents || 0) !== Number(product.salePriceCents || 0);
    const infoChanged =
      String(latest.name || '') !== String(product.name || '') ||
      String(latest.description || '') !== String(product.description || '') ||
      String(latest.category?.name || '') !== String(product.category?.name || '');
    const variantsChanged = !sameVariants(variants, latestVariants);
    const imagesChanged = !sameImageList(imageUrls, latestImages);

    product = latest;
    variants = latestVariants;
    imageUrls = latestImages;

    if (infoChanged) {
      const nameNode = document.querySelector('#pdp-name');
      const descNode = document.querySelector('#pdp-description');
      const catNode = document.querySelector('#pdp-category');
      if (nameNode) nameNode.textContent = latest.name || '';
      if (descNode) descNode.textContent = latest.description || '';
      if (catNode) catNode.textContent = latest.category?.name || t('product');
    }

    if (priceChanged) {
      const priceWrap = document.querySelector('#pdp-price-wrap');
      if (priceWrap) priceWrap.innerHTML = productPriceMarkup(latest);
    }

    if (imagesChanged) {
      imageIndex = 0;
      const mediaWrap = document.querySelector('.pdp-media-wrap');
      if (mediaWrap) {
        mediaWrap.outerHTML = mediaMarkup();
        bindMediaEvents();
      }
    }

    if (variantsChanged) {
      colors = [...new Set(variants.map((item) => item.color).filter(Boolean))];
      sizes = [...new Set(variants.map((item) => item.size).filter(Boolean))];
      const latestColors = colors;
      const latestSizes = sizes;
      if (!latestColors.includes(selectedColor)) selectedColor = latestColors[0] || '';
      if (!latestSizes.includes(selectedSize)) selectedSize = latestSizes[0] || '';
      bindPicker();
    }
  }

  if (!window.__pdpLiveSyncTimers) window.__pdpLiveSyncTimers = new Map();
  const prevTimer = window.__pdpLiveSyncTimers.get(String(id));
  if (prevTimer) window.clearInterval(prevTimer);
  const timer = window.setInterval(() => {
    refreshLiveProduct().catch(() => {});
  }, 5000);
  window.__pdpLiveSyncTimers.set(String(id), timer);
  window.addEventListener(
    'beforeunload',
    () => {
      window.clearInterval(timer);
      window.__pdpLiveSyncTimers.delete(String(id));
    },
    { once: true }
  );
}

init();
