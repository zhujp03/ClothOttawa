import { request, getAdminToken, setAdminToken, formatPrice } from './common.js';

const token = getAdminToken();
if (!token) location.href = '/admin/login';
const PERMISSION = {
  MESSAGES: 'messages',
  ORDERS: 'orders',
  CATALOG: 'catalog',
  CUSTOMERS: 'customers',
  SALES_REPORTS: 'sales_reports'
};

function initialProductForm() {
  return {
    id: null,
    name: '',
    description: '',
    price: '',
    cost: '',
    isOnSale: false,
    salePrice: '',
    categoryId: '',
    isActive: true,
    introPdfUrl: '',
    imageUrls: [],
    pendingImageFiles: [],
    pendingSpecPdfFile: null,
    variantColors: '',
    variantSizes: '',
    defaultVariantStock: 0,
    variants: []
  };
}

function parseOptionList(raw = '') {
  const seen = new Set();
  return String(raw)
    .split(/[\n,，;；/|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function variantKey(color, size) {
  return `${String(color).trim().toLowerCase()}::${String(size).trim().toLowerCase()}`;
}

function buildVariantMatrix(colors, sizes, existing, defaultStock) {
  const existingMap = new Map((existing || []).map((item) => [variantKey(item.color, item.size), item]));
  const out = [];
  colors.forEach((color) => {
    sizes.forEach((size) => {
      const old = existingMap.get(variantKey(color, size));
      out.push({
        color,
        size,
        stock: Number(old?.stock ?? defaultStock) || 0,
        sku: old?.sku || ''
      });
    });
  });
  return out;
}

function buildTree(items) {
  const map = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) map.get(node.parentId).children.push(node);
    else roots.push(node);
  });
  map.forEach((node) => {
    node.children.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.id - b.id);
  });
  roots.sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.id - b.id);
  return roots;
}

function buildCategoryOptions(nodes, selectedValue = '', depth = 0) {
  return nodes
    .map((node) => {
      const indent = depth === 0 ? '' : `${'　'.repeat(depth)}└ `;
      const current = `<option value="${node.id}" ${
        String(selectedValue) === String(node.id) ? 'selected' : ''
      }>${indent}${node.name}</option>`;
      const children = node.children?.length ? buildCategoryOptions(node.children, selectedValue, depth + 1) : '';
      return `${current}${children}`;
    })
    .join('');
}

function syncProductFormFromDom() {
  const form = document.querySelector('#product-form');
  if (!form) return;
  const raw = new FormData(form);
  state.productForm.name = String(raw.get('name') || '');
  state.productForm.description = String(raw.get('description') || '');
  state.productForm.price = String(raw.get('price') || '');
  state.productForm.cost = String(raw.get('cost') || '');
  state.productForm.isOnSale = Boolean(raw.get('isOnSale'));
  state.productForm.salePrice = String(raw.get('salePrice') || '');
  state.productForm.categoryId = String(raw.get('categoryId') || '');
  state.productForm.isActive = Boolean(raw.get('isActive'));
  state.productForm.variantColors = String(raw.get('variantColors') || '');
  state.productForm.variantSizes = String(raw.get('variantSizes') || '');
  state.productForm.defaultVariantStock = Number(raw.get('defaultVariantStock') || 0);
}

const state = {
  admin: null,
  permissions: new Set(),
  categories: [],
  products: [],
  orders: [],
  orderHistory: [],
  salesSummary: null,
  salesMonth: currentTorontoMonth(),
  categoryForm: { name: '', parentId: '' },
  productForm: initialProductForm(),
  skuSearch: '',
  error: ''
};

let autoRefreshTimer = null;
let draggedCategoryId = null;
let categoryReorderInFlight = false;

function headers(extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

function hasPermission(permission) {
  return state.permissions.has(permission);
}

function currentTorontoMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(new Date());
  const year = parts.find((item) => item.type === 'year')?.value || '';
  const month = parts.find((item) => item.type === 'month')?.value || '';
  return year && month ? `${year}-${month}` : '';
}

async function loadAdminProfile() {
  const data = await request('/api/auth/admin/me', { headers: headers() });
  state.admin = data?.admin || null;
  state.permissions = new Set(data?.admin?.permissions || []);
}

function setError(message = '') {
  state.error = message;
  const node = document.querySelector('#admin-error');
  if (!node) return;
  node.textContent = message;
  node.style.display = message ? 'block' : 'none';
}

function cloneProductFormFiles(files = []) {
  return Array.from(files).filter((file) => file instanceof File);
}

function selectedFilesSummary(files = []) {
  if (!files.length) return '';
  if (files.length === 1) return files[0].name;
  const names = files
    .slice(0, 3)
    .map((file) => file.name)
    .join('、');
  return files.length > 3 ? `${names} 等 ${files.length} 张` : `${names}（共 ${files.length} 张）`;
}

function variantMatrixHtml(variants = []) {
  if (!variants.length) return '';
  return `<div class="variant-matrix">
      <table>
        <thead><tr><th>颜色</th><th>尺码</th><th>库存</th><th>SKU（自动）</th></tr></thead>
        <tbody>
          ${variants
            .map(
              (variant, index) => `
            <tr>
              <td>${variant.color}</td>
              <td>${variant.size}</td>
              <td><input type="number" min="0" step="1" data-stock-index="${index}" value="${variant.stock}" /></td>
              <td>${variant.sku || '提交后自动生成'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>`;
}

function bindVariantStockInputs() {
  document.querySelectorAll('[data-stock-index]').forEach((node) => {
    node.addEventListener('change', () => {
      const index = Number(node.dataset.stockIndex);
      state.productForm.variants[index].stock = Number(node.value || 0);
    });
  });
}

function syncProductFilesFromInputs() {
  const imageInput = document.querySelector('#product-form input[name="images"]');
  if (imageInput instanceof HTMLInputElement) {
    state.productForm.pendingImageFiles = cloneProductFormFiles(imageInput.files || []);
  }

  const pdfInput = document.querySelector('#product-form input[name="specPdf"]');
  if (pdfInput instanceof HTMLInputElement) {
    state.productForm.pendingSpecPdfFile = pdfInput.files?.[0] instanceof File ? pdfInput.files[0] : null;
  }
}

function restoreProductFilesToInputs() {
  const imageInput = document.querySelector('#product-form input[name="images"]');
  if (imageInput instanceof HTMLInputElement && Array.isArray(state.productForm.pendingImageFiles) && typeof DataTransfer !== 'undefined') {
    const transfer = new DataTransfer();
    state.productForm.pendingImageFiles.forEach((file) => transfer.items.add(file));
    imageInput.files = transfer.files;
  }

  const pdfInput = document.querySelector('#product-form input[name="specPdf"]');
  if (pdfInput instanceof HTMLInputElement && state.productForm.pendingSpecPdfFile instanceof File && typeof DataTransfer !== 'undefined') {
    const transfer = new DataTransfer();
    transfer.items.add(state.productForm.pendingSpecPdfFile);
    pdfInput.files = transfer.files;
  }
}

function renderVariantMatrix() {
  const container = document.querySelector('#variant-matrix-container');
  if (!container) return;
  container.innerHTML = variantMatrixHtml(state.productForm.variants);
  bindVariantStockInputs();
}

function categoryParentIdFromGroup(group) {
  const parentAttr = group.getAttribute('data-parent-id');
  return parentAttr ? Number(parentAttr) : null;
}

function categoryOrderedIdsFromGroup(group) {
  return [...group.children]
    .map((node) => Number(node.getAttribute('data-category-item') || 0))
    .filter(Boolean);
}

function applyLocalCategoryOrder(parentId, orderedIds) {
  const rank = new Map(orderedIds.map((id, index) => [Number(id), index]));
  state.categories = state.categories
    .map((item) =>
      item.parentId === parentId && rank.has(item.id)
        ? {
            ...item,
            sortOrder: rank.get(item.id)
          }
        : item
    )
    .sort((a, b) => {
      const parentA = a.parentId ?? -1;
      const parentB = b.parentId ?? -1;
      if (parentA !== parentB) return parentA - parentB;
      return Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || a.id - b.id;
    });
}

async function loadAll() {
  const tasks = [];

  if (hasPermission(PERMISSION.CATALOG)) {
    tasks.push(request('/api/categories', { headers: headers() }));
    tasks.push(
      request(
        `/api/products?includeInactive=1&limit=100${
          state.skuSearch ? `&sku=${encodeURIComponent(state.skuSearch)}` : ''
        }`,
        { headers: headers() }
      )
    );
  }

  if (hasPermission(PERMISSION.ORDERS)) {
    tasks.push(request('/api/orders', { headers: headers() }));
    tasks.push(request('/api/orders/history', { headers: headers() }));
  }

  if (hasPermission(PERMISSION.SALES_REPORTS)) {
    tasks.push(request(`/api/orders/sales-summary?month=${encodeURIComponent(state.salesMonth)}`, { headers: headers() }));
  }

  const results = await Promise.all(tasks);
  let cursor = 0;

  if (hasPermission(PERMISSION.CATALOG)) {
    const categories = results[cursor] || [];
    const productsData = results[cursor + 1] || { items: [] };
    state.categories = categories;
    state.products = productsData.items || [];
    cursor += 2;
  } else {
    state.categories = [];
    state.products = [];
  }

  if (hasPermission(PERMISSION.ORDERS)) {
    state.orders = results[cursor] || [];
    state.orderHistory = results[cursor + 1] || [];
    cursor += 2;
  } else {
    state.orders = [];
    state.orderHistory = [];
  }

  if (hasPermission(PERMISSION.SALES_REPORTS)) {
    state.salesSummary = results[cursor] || null;
  } else {
    state.salesSummary = null;
  }
}

function categoryTreeHtml(nodes, depth = 0, parentId = null) {
  return `<ul class="category-level depth-${depth}" data-category-group="${parentId === null ? 'root' : parentId}" data-parent-id="${
    parentId === null ? '' : parentId
  }">
    ${nodes
      .map(
        (node, index) => `
      <li class="category-tree-item" data-category-item="${node.id}" draggable="true">
        <div class="category-node-row">
          <div class="category-node-main">
            <span class="category-bullet">${depth === 0 ? '•' : '↳'}</span>
            <span class="category-sort-badge">${index + 1}</span>
            <span>${node.name}</span>
          </div>
          <div class="category-node-actions">
            <span class="category-drag-handle" title="拖拽排序">::</span>
            <button class="danger-ghost" type="button" data-delete-category="${node.id}">删除</button>
          </div>
        </div>
        ${node.children?.length ? categoryTreeHtml(node.children, depth + 1, node.id) : ''}
      </li>
    `
      )
      .join('')}
  </ul>`;
}

async function persistCategoryGroupOrder(group) {
  const orderedIds = categoryOrderedIdsFromGroup(group);
  if (orderedIds.length === 0) return;

  await request('/api/categories/reorder', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      parentId: categoryParentIdFromGroup(group),
      orderedIds
    })
  });
}

function bindCategoryTreeDnD() {
  document.querySelectorAll('[data-category-item]').forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      draggedCategoryId = Number(item.getAttribute('data-category-item') || 0);
      item.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(draggedCategoryId));
    });

    item.addEventListener('dragend', () => {
      draggedCategoryId = null;
      item.classList.remove('is-dragging');
      document.querySelectorAll('.category-tree-item.is-drop-target').forEach((node) => node.classList.remove('is-drop-target'));
    });

    item.addEventListener('dragover', (event) => {
      event.preventDefault();
      if (!draggedCategoryId || draggedCategoryId === Number(item.getAttribute('data-category-item') || 0)) return;
      event.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.category-tree-item.is-drop-target').forEach((node) => node.classList.remove('is-drop-target'));
      item.classList.add('is-drop-target');
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('is-drop-target');
    });

    item.addEventListener('drop', async (event) => {
      event.preventDefault();
      item.classList.remove('is-drop-target');
      const targetId = Number(item.getAttribute('data-category-item') || 0);
      if (!draggedCategoryId || !targetId || draggedCategoryId === targetId) return;

      const draggedItem = document.querySelector(`[data-category-item="${draggedCategoryId}"]`);
      if (!(draggedItem instanceof HTMLElement)) return;
      const targetItem = item;
      const group = targetItem.parentElement;
      if (!(group instanceof HTMLElement) || draggedItem.parentElement !== group) {
        setError('目前只支持同级分类之间拖拽排序。');
        return;
      }
      if (categoryReorderInFlight) {
        setError('上一条分类排序还在保存，请稍候再拖拽。');
        return;
      }

      const targetRect = targetItem.getBoundingClientRect();
      const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
      if (insertAfter) {
        group.insertBefore(draggedItem, targetItem.nextElementSibling);
      } else {
        group.insertBefore(draggedItem, targetItem);
      }

      const parentId = categoryParentIdFromGroup(group);
      const orderedIds = categoryOrderedIdsFromGroup(group);
      const previousCategories = state.categories.map((category) => ({ ...category }));

      try {
        categoryReorderInFlight = true;
        setError('');
        applyLocalCategoryOrder(parentId, orderedIds);
        render();
        await persistCategoryGroupOrder(group);
        state.categories = await request('/api/categories', { headers: headers() });
        render();
      } catch (error) {
        state.categories = previousCategories;
        setError(error.message || '更新分类顺序失败');
        render();
      } finally {
        categoryReorderInFlight = false;
      }
    });
  });
}

function shippingDisplay(order) {
  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    return order.trackingNumber ? `快递单号：${order.trackingNumber}` : '快递单号：未填写';
  }
  return 'Preparing for shipping';
}

function statusLabel(status) {
  return (
    {
      PLACED: '已下单',
      PAID: '已支付',
      PACKING: '备货中',
      SHIPPED: '已发货',
      DELIVERED: '已送达',
      CANCELLED: '已取消'
    }[status] || status
  );
}

function paymentMethodLabel(method) {
  if (String(method || '').toUpperCase() === 'ETRANSFER') return 'E-transfer';
  if (String(method || '').toUpperCase() === 'SQUARE') return 'Square';
  return method || '-';
}

function orderRowsHtml(orders = []) {
  if (orders.length === 0) {
    return '<tr><td colspan="7"><p class="empty-state">暂无订单</p></td></tr>';
  }
  return orders
    .map((order) => {
      const showTrackingInput = order.status === 'SHIPPED' || order.status === 'DELIVERED';
      return `<tr>
        <td><strong>${order.orderNumber}</strong><div class="table-subline">${new Date(order.createdAt).toLocaleString(
          'zh-CN'
        )}</div></td>
        <td>
          <div><strong>账号：</strong>${order.customer?.firstName || ''} ${order.customer?.lastName || ''}</div>
          <div class="table-subline">${order.customer?.email || order.shippingEmail || ''}</div>
          <div class="table-subline">${order.customer?.phone || order.shippingPhone || ''}</div>
          <div class="table-subline" style="margin-top:.35rem;"><strong>收件人：</strong>${order.shippingName || '-'}</div>
          <div class="table-subline"><strong>收件电话：</strong>${order.shippingPhone || '-'}</div>
          <div class="table-subline"><strong>收件邮箱：</strong>${order.shippingEmail || '-'}</div>
          <div class="table-subline"><strong>收货地址：</strong>${buildShippingAddress(order) || '-'}</div>
        </td>
        <td><div class="table-items-stack">${(order.items || [])
          .map((item) => `<div>${item.productName} (${item.color}/${item.size}) x ${item.quantity}</div>`)
          .join('')}</div></td>
        <td>${formatPrice(order.totalCents)}</td>
        <td>
          <strong>${paymentMethodLabel(order.paymentMethod)}</strong>
          <div class="table-subline">${order.paymentReference || '-'}</div>
        </td>
        <td>
          <select data-order-status="${order.id}" data-current-status="${order.status}">
            ${['PLACED', 'PAID', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
              .map(
                (status) =>
                  `<option value="${status}" ${status === order.status ? 'selected' : ''}>${statusLabel(status)}</option>`
              )
              .join('')}
          </select>
        </td>
        <td>
          <div class="table-subline">${shippingDisplay(order)}</div>
          ${
            showTrackingInput
              ? `<input data-order-tracking="${order.id}" placeholder="填写快递单号" value="${order.trackingNumber || ''}" />`
              : ''
          }
          <button type="button" class="danger-ghost" data-delete-order="${order.id}" style="margin-top:.45rem;">删除订单</button>
        </td>
      </tr>`;
    })
    .join('');
}

function orderHistoryRowsHtml(orders = []) {
  if (orders.length === 0) {
    return '<tr><td colspan="7"><p class="empty-state">暂无历史订单</p></td></tr>';
  }
  return orders
    .map(
      (order) => `<tr>
      <td><strong>${order.orderNumber}</strong><div class="table-subline">${new Date(order.createdAt).toLocaleString(
        'zh-CN'
      )}</div></td>
      <td>
        <div><strong>账号：</strong>${order.customer?.firstName || ''} ${order.customer?.lastName || ''}</div>
        <div class="table-subline">${order.customer?.email || order.shippingEmail || ''}</div>
        <div class="table-subline">${order.customer?.phone || order.shippingPhone || ''}</div>
        <div class="table-subline" style="margin-top:.35rem;"><strong>收件人：</strong>${order.shippingName || '-'}</div>
        <div class="table-subline"><strong>收件电话：</strong>${order.shippingPhone || '-'}</div>
        <div class="table-subline"><strong>收件邮箱：</strong>${order.shippingEmail || '-'}</div>
        <div class="table-subline"><strong>收货地址：</strong>${buildShippingAddress(order) || '-'}</div>
      </td>
      <td><div class="table-items-stack">${(order.items || [])
        .map((item) => `<div>${item.productName} (${item.color}/${item.size}) x ${item.quantity}</div>`)
        .join('')}</div></td>
      <td>${formatPrice(order.totalCents)}</td>
      <td>
        <strong>${paymentMethodLabel(order.paymentMethod)}</strong>
        <div class="table-subline">${order.paymentReference || '-'}</div>
      </td>
      <td><span class="status-pill delivered">${statusLabel(order.status || 'DELIVERED')}</span></td>
      <td>
        <button type="button" class="ghost-btn" data-restore-history-order="${order.id}">移回订单列表</button>
        <button type="button" class="danger-ghost" data-delete-history-order="${order.id}" style="margin-top:.45rem;">删除历史订单</button>
        <div class="table-subline">移回后状态默认为“已发货”</div>
      </td>
    </tr>`
    )
    .join('');
}

function ordersSnapshot(orders = [], history = []) {
  return JSON.stringify({
    orders: orders.map((item) => ({
      id: item.id,
      status: item.status,
      trackingNumber: item.trackingNumber || '',
      paymentReference: item.paymentReference || '',
      updatedAt: item.updatedAt
    })),
    history: history.map((item) => ({
      id: item.id,
      status: item.status,
      paymentReference: item.paymentReference || '',
      updatedAt: item.updatedAt
    }))
  });
}

function refreshOrderTablesOnly() {
  const ordersTbody = document.querySelector('#orders-tbody');
  const historyTbody = document.querySelector('#order-history-tbody');
  if (!ordersTbody || !historyTbody) return;
  ordersTbody.innerHTML = orderRowsHtml(state.orders);
  historyTbody.innerHTML = orderHistoryRowsHtml(state.orderHistory);
  bindOrderEvents();
}

function bindOrderEvents() {
  document.querySelectorAll('[data-delete-order]').forEach((node) => {
    node.addEventListener('click', async () => {
      const orderId = Number(node.dataset.deleteOrder || 0);
      if (!orderId) return;
      if (!confirm('确认删除这个订单？此操作不可恢复。')) return;
      try {
        await request(`/api/orders/${orderId}`, { method: 'DELETE', headers: headers() });
        await loadAll();
        refreshOrderTablesOnly();
      } catch (error) {
        setError(error.message || '删除订单失败');
      }
    });
  });

  document.querySelectorAll('[data-delete-history-order]').forEach((node) => {
    node.addEventListener('click', async () => {
      const orderId = Number(node.dataset.deleteHistoryOrder || 0);
      if (!orderId) return;
      if (!confirm('确认删除这个历史订单？此操作不可恢复。')) return;
      try {
        await request(`/api/orders/history/${orderId}`, { method: 'DELETE', headers: headers() });
        await loadAll();
        refreshOrderTablesOnly();
      } catch (error) {
        setError(error.message || '删除历史订单失败');
      }
    });
  });

  document.querySelectorAll('[data-order-status]').forEach((node) => {
    node.addEventListener('change', async () => {
      const orderId = node.dataset.orderStatus;
      const status = node.value;
      const previousStatus = node.dataset.currentStatus || '';
      if (status === 'DELIVERED') {
        const confirmed = confirm('确认该订单已经送达？确认后将自动移动到历史订单列表。');
        if (!confirmed) {
          node.value = previousStatus || 'SHIPPED';
          return;
        }
      }
      const trackingInput = document.querySelector(`[data-order-tracking="${orderId}"]`);
      const trackingNumber = trackingInput ? trackingInput.value : '';
      try {
        await request(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status, trackingNumber, confirmDelivered: status === 'DELIVERED' })
        });
        await loadAll();
        refreshOrderTablesOnly();
      } catch (error) {
        node.value = previousStatus || node.value;
        setError(error.message || '更新订单状态失败');
      }
    });
  });

  document.querySelectorAll('[data-order-tracking]').forEach((node) => {
    node.addEventListener('blur', async () => {
      const orderId = node.dataset.orderTracking;
      const rowStatus = document.querySelector(`[data-order-status="${orderId}"]`)?.value;
      if (!(rowStatus === 'SHIPPED' || rowStatus === 'DELIVERED')) return;
      try {
        await request(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ status: rowStatus, trackingNumber: node.value || '' })
        });
      } catch (error) {
        setError(error.message || '更新快递单号失败');
      }
    });
  });

  document.querySelectorAll('[data-restore-history-order]').forEach((node) => {
    node.addEventListener('click', async () => {
      const id = Number(node.dataset.restoreHistoryOrder || 0);
      if (!id) return;
      const confirmed = confirm('确认将此历史订单移回订单列表？移回后状态默认为“已发货”。');
      if (!confirmed) return;
      try {
        await request(`/api/orders/history/${id}/restore`, {
          method: 'POST',
          headers: headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ confirmRestore: true })
        });
        await loadAll();
        refreshOrderTablesOnly();
      } catch (error) {
        setError(error.message || '恢复历史订单失败');
      }
    });
  });
}

function buildShippingAddress(order) {
  const line1 = String(order.shippingAddress1 || '').trim();
  const line2 = String(order.shippingAddress2 || '').trim();
  const city = String(order.shippingCity || '').trim();
  const province = String(order.shippingProvince || '').trim();
  const postal = String(order.shippingPostalCode || '').trim();
  const country = String(order.shippingCountry || '').trim();

  const local = [city, province, postal].filter(Boolean).join(', ');
  return [line1, line2, local, country].filter(Boolean).join(' | ');
}

function salesItemsRowsHtml(items = []) {
  if (!items.length) {
    return '<tr><td colspan="7"><p class="empty-state">该月暂无销售数据</p></td></tr>';
  }

  return items
    .map(
      (item) => `<tr>
        <td><strong>${item.orderNumber}</strong><div class="table-subline">${new Date(item.createdAt).toLocaleString('zh-CN')}</div></td>
        <td>${item.customer?.firstName || ''} ${item.customer?.lastName || ''}<div class="table-subline">${item.customer?.email || '-'}</div></td>
        <td>${paymentMethodLabel(item.paymentMethod)}</td>
        <td>${formatPrice(item.subtotalCents)}</td>
        <td>${formatPrice(item.totalCents)}</td>
        <td>${item.paymentReference || '-'}</td>
        <td>${item.isHistorical ? '历史订单' : '当前订单'}</td>
      </tr>`
    )
    .join('');
}

function salesProductRowsHtml(items = []) {
  if (!items.length) {
    return '<tr><td colspan="4"><p class="empty-state">该月暂无商品成交数据</p></td></tr>';
  }

  return items
    .map(
      (item, index) => `<tr>
        <td>${index + 1}</td>
        <td>${item.productName || '-'}</td>
        <td>${Number(item.paidOrderCount || 0)}</td>
        <td>${Number(item.soldQuantity || 0)}</td>
      </tr>`
    )
    .join('');
}

function salesSummaryHtml() {
  const summary = state.salesSummary;
  if (!summary) {
    return '';
  }

  return `
    <div class="panel product-table-wrap" id="sales-summary-panel">
      <div class="panel-header-row">
        <h2>月度销售汇总（${summary.month} / America/Toronto）</h2>
        <form id="sales-month-form" style="display:flex;gap:.5rem;align-items:end;">
          <label style="margin:0;">
            <span style="display:block;font-size:.75rem;color:var(--ink-500);">月份</span>
            <input type="month" name="salesMonth" value="${state.salesMonth}" required />
          </label>
          <button type="submit" class="ghost-btn">查询</button>
        </form>
      </div>
      <div class="admin-grid" style="margin-bottom:.8rem;">
        <div class="panel">
          <h3>总销售</h3>
          <p>订单数：<strong>${summary.totals?.orders || 0}</strong></p>
          <p>销售额：<strong>${formatPrice(summary.totals?.totalCents || 0)}</strong></p>
        </div>
        <div class="panel">
          <h3>Square</h3>
          <p>订单数：<strong>${summary.totals?.square?.orders || 0}</strong></p>
          <p>销售额：<strong>${formatPrice(summary.totals?.square?.totalCents || 0)}</strong></p>
        </div>
        <div class="panel">
          <h3>E-transfer</h3>
          <p>订单数：<strong>${summary.totals?.etransfer?.orders || 0}</strong></p>
          <p>销售额：<strong>${formatPrice(summary.totals?.etransfer?.totalCents || 0)}</strong></p>
        </div>
      </div>
      <div class="table-scroll">
        <table class="product-table">
          <thead><tr><th>订单号</th><th>客户</th><th>支付方式</th><th>小计</th><th>总计</th><th>支付参考</th><th>来源</th></tr></thead>
          <tbody>${salesItemsRowsHtml(summary.items || [])}</tbody>
        </table>
      </div>
      <div class="table-scroll" style="margin-top:.9rem;">
        <table class="product-table">
          <thead><tr><th>#</th><th>商品</th><th>成功支付次数</th><th>售出件数</th></tr></thead>
          <tbody>${salesProductRowsHtml(summary.productStats || [])}</tbody>
        </table>
      </div>
    </div>
  `;
}

function render() {
  const root = document.querySelector('#admin-root');
  if (!root) return;

  const tree = buildTree(state.categories);
  const categoryOptionsForParent = buildCategoryOptions(tree, state.categoryForm.parentId);
  const categoryOptionsForProduct = buildCategoryOptions(tree, state.productForm.categoryId);
  const canCatalog = hasPermission(PERMISSION.CATALOG);
  const canOrders = hasPermission(PERMISSION.ORDERS);
  const canMessages = hasPermission(PERMISSION.MESSAGES);
  const canCustomers = hasPermission(PERMISSION.CUSTOMERS);
  const canSales = hasPermission(PERMISSION.SALES_REPORTS);
  const roleLabel =
    state.admin?.role === 'OWNER' ? 'Owner' : state.admin?.role === 'IVAN' ? 'Ivan' : state.admin?.role || 'Admin';

  root.innerHTML = `
    <section class="admin-shell">
      <div class="admin-topbar">
        <div>
          <h1>后台管理系统</h1>
          <p>当前账号：${state.admin?.username || '-'}（${roleLabel}）</p>
        </div>
        <div class="admin-messages-actions">
          ${canMessages ? '<a href="/admin/messages" class="ghost-btn admin-link-btn">消息中心</a>' : ''}
          ${canSales ? '<a href="#sales-summary-panel" class="ghost-btn admin-link-btn">销售汇总</a>' : ''}
          ${canCustomers ? '<a href="/admin/users" class="ghost-btn admin-link-btn">用户列表</a>' : ''}
          ${canCustomers ? '<a href="/admin/blocked-users" class="ghost-btn admin-link-btn">被拉黑列表</a>' : ''}
          <button type="button" class="danger-ghost" id="admin-logout">退出登录</button>
        </div>
      </div>
      <p id="admin-error" class="admin-error" style="${state.error ? '' : 'display:none;'}">${state.error || ''}</p>

      ${
        canCatalog
          ? `<div class="admin-grid">
        <form class="panel" id="category-form">
          <h2>新增分类</h2>
          <label>分类名称<input name="name" required value="${state.categoryForm.name}" /></label>
          <label>父分类
            <select name="parentId">
              <option value="">无</option>
              ${categoryOptionsForParent}
            </select>
          </label>
          <button type="submit">添加分类</button>
        </form>
        <div class="panel panel-list">
          <h2>分类树</h2>
          <p class="panel-note">直接拖拽这里的分类顺序。后台从上到下的顺序，就是前台导航从左到右的顺序。</p>
          <div class="category-tree">${categoryTreeHtml(tree)}</div>
        </div>
      </div>`
          : ''
      }

      ${
        canCatalog
          ? `<form class="panel product-form" id="product-form">
        <div class="panel-header-row">
          <h2>${state.productForm.id ? '编辑商品' : '创建商品'}</h2>
          ${state.productForm.id ? '<button type="button" class="ghost-btn" id="cancel-edit">取消编辑</button>' : ''}
        </div>
        <div class="form-columns">
          <label>商品名称<input name="name" required minlength="2" value="${state.productForm.name}" /></label>
          <label>价格（CAD）<input type="number" min="0.01" step="0.01" name="price" required value="${state.productForm.price}" /></label>
          <label>成本价（CAD）<input type="number" min="0" step="0.01" name="cost" required value="${state.productForm.cost}" /></label>
          <label class="toggle-row"><input type="checkbox" name="isOnSale" ${
            state.productForm.isOnSale ? 'checked' : ''
          } /><span>On Sale（促销）</span></label>
          <label>促销价（CAD）<input type="number" min="0.01" step="0.01" name="salePrice" ${
            state.productForm.isOnSale ? '' : 'disabled'
          } value="${state.productForm.salePrice}" placeholder="仅促销时填写" /></label>
          <label>分类
            <select name="categoryId" required>
              <option value="">请选择分类</option>
              ${categoryOptionsForProduct}
            </select>
          </label>
          <label class="span-2">商品图片（可多选，JPG/PNG，单张最大 25MB）<input type="file" name="images" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" /></label>
          <label>产品介绍PDF（最大 25MB）<input type="file" name="specPdf" accept="application/pdf,.pdf" /></label>
          <label class="toggle-row"><input type="checkbox" name="isActive" ${
            state.productForm.isActive ? 'checked' : ''
          } /><span>是否上架</span></label>
        </div>
        ${
          state.productForm.pendingImageFiles.length > 0
            ? `<p class="table-subline">待上传图片：${selectedFilesSummary(state.productForm.pendingImageFiles)}</p>`
            : ''
        }
        ${
          state.productForm.pendingSpecPdfFile
            ? `<p class="table-subline">待上传 PDF：${state.productForm.pendingSpecPdfFile.name}</p>`
            : ''
        }
        ${
          state.productForm.introPdfUrl
            ? `<p class="table-subline">当前产品介绍文件：<a href="${state.productForm.introPdfUrl}" target="_blank" rel="noopener">查看 PDF</a></p>`
            : ''
        }
        ${
          (state.productForm.imageUrls || []).length > 1
            ? `<p class="table-subline">当前附加图片数量：${Math.max(0, (state.productForm.imageUrls || []).length - 1)} 张</p>`
            : ''
        }
        <label>商品描述<textarea name="description" required minlength="10" rows="5">${state.productForm.description}</textarea></label>

        <div class="variant-panel">
          <div class="variant-head"><h3>库存矩阵（颜色 x 尺码）</h3></div>
          <div class="variant-builder">
            <label>颜色列表（逗号分隔）<input name="variantColors" value="${state.productForm.variantColors}" placeholder="黑色, 白色, 银色" /></label>
            <label>尺码列表（逗号分隔）<input name="variantSizes" value="${state.productForm.variantSizes}" placeholder="XS, S, M, L, XL" /></label>
            <label>默认库存<input type="number" min="0" step="1" name="defaultVariantStock" value="${state.productForm.defaultVariantStock}" /></label>
          </div>
          <div class="variant-actions"><button type="button" class="ghost-btn" id="build-matrix">生成库存矩阵</button></div>
          <div class="variant-help">SKU 自动生成且唯一（按商品 + 颜色 + 尺码），你只需要填库存。</div>
          <div id="variant-matrix-container">${variantMatrixHtml(state.productForm.variants)}</div>
        </div>
        <button type="submit">${state.productForm.id ? '更新商品' : '创建商品'}</button>
      </form>`
          : ''
      }

      ${
        canCatalog
          ? `<div class="panel product-table-wrap">
        <div class="panel-header-row">
          <h2>商品列表</h2>
          <form id="sku-search-form" class="shop-filters-lite" style="display:flex;gap:.5rem;align-items:end;">
            <label style="margin:0;">
              <span style="display:block;font-size:.75rem;color:var(--ink-500);">SKU 搜索</span>
              <input name="skuSearch" placeholder="输入 SKU" value="${state.skuSearch}" />
            </label>
            <button type="submit" class="ghost-btn">搜索</button>
            ${
              state.skuSearch
                ? '<button type="button" class="danger-ghost" id="clear-sku-search">清除</button>'
                : ''
            }
          </form>
        </div>
        <div class="table-scroll">
          <table class="product-table">
            <thead><tr><th>图</th><th>名称</th><th>分类</th><th>价格</th><th>成本价</th><th>促销</th><th>状态</th><th>首页主推</th><th>总库存</th><th>SKU 示例</th><th>操作</th></tr></thead>
            <tbody>
              ${state.products
                .map((product) => {
                  const totalStock = (product.variants || []).reduce((sum, item) => sum + Number(item.stock || 0), 0);
                  const skuExample = product.variants?.[0]?.sku || '-';
                  const salePrice = Number(product.salePriceCents || 0) > 0 ? (Number(product.salePriceCents || 0) / 100).toFixed(2) : '';
                  return `<tr>
                    <td><img class="admin-product-thumb" src="${product.imageUrl || '/uploads/placeholder-product.svg'}" alt="${product.name}" /></td>
                    <td>${product.name}</td>
                    <td>${product.category?.name || '-'}</td>
                    <td>
                      <div>${formatPrice(product.priceCents)}</div>
                      ${
                        product.isOnSale && product.salePriceCents
                          ? `<div class="table-subline sale-hint">现价 ${formatPrice(product.salePriceCents)}（-${product.discountPercent || 0}%）</div>`
                          : ''
                      }
                    </td>
                    <td>${formatPrice(product.costCents || 0)}</td>
                    <td>
                      <div class="sale-control-row">
                        <select data-product-sale-enabled="${product.id}">
                          <option value="false" ${product.isOnSale ? '' : 'selected'}>否</option>
                          <option value="true" ${product.isOnSale ? 'selected' : ''}>是</option>
                        </select>
                        <input type="number" min="0.01" step="0.01" data-product-sale-price="${product.id}" ${
                          product.isOnSale ? '' : 'disabled'
                        } value="${salePrice}" placeholder="促销价" />
                        <button type="button" class="ghost-btn" data-product-sale-save="${product.id}">保存</button>
                      </div>
                    </td>
                    <td>
                      <select data-product-visibility="${product.id}">
                        <option value="true" ${product.isActive ? 'selected' : ''}>上架</option>
                        <option value="false" ${product.isActive ? '' : 'selected'}>下架</option>
                      </select>
                    </td>
                    <td>
                      <div>${product.isHomeFeatured ? '当前显示' : '未设置'}</div>
                      <div class="table-subline">${
                        product.isActive ? '可设为 Just Landed' : '下架商品不可主推'
                      }</div>
                    </td>
                    <td>${totalStock}</td>
                    <td>${skuExample}</td>
                    <td class="action-cell">
                      <div class="action-row">
                        <button type="button" class="ghost-btn" data-set-home-feature="${product.id}" ${
                          product.isActive ? '' : 'disabled'
                        }>${product.isHomeFeatured ? '取消主推' : '设为主推'}</button>
                      </div>
                      <div class="action-row">
                        <button type="button" class="ghost-btn" data-edit-product="${product.id}">编辑</button>
                        <button type="button" class="danger-ghost" data-delete-product="${product.id}">删除</button>
                      </div>
                    </td>
                  </tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </div>
      </div>`
          : ''
      }

      ${
        canOrders
          ? `<div class="panel product-table-wrap">
        <h2>订单列表</h2>
        <div class="table-scroll">
          <table class="product-table">
            <thead><tr><th>订单号</th><th>客户与收货信息</th><th>商品明细</th><th>总金额</th><th>支付方式</th><th>状态</th><th>物流信息</th></tr></thead>
            <tbody id="orders-tbody">${orderRowsHtml(state.orders)}</tbody>
          </table>
        </div>
      </div>`
          : ''
      }

      ${
        canOrders
          ? `<div class="panel product-table-wrap">
        <h2>历史订单列表</h2>
        <div class="table-scroll">
          <table class="product-table">
            <thead><tr><th>订单号</th><th>客户与收货信息</th><th>商品明细</th><th>总金额</th><th>支付方式</th><th>状态</th><th>操作</th></tr></thead>
            <tbody id="order-history-tbody">${orderHistoryRowsHtml(state.orderHistory)}</tbody>
          </table>
        </div>
      </div>`
          : ''
      }

      ${canSales ? salesSummaryHtml() : ''}
    </section>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelector('#admin-logout')?.addEventListener('click', () => {
    setAdminToken('');
    location.href = '/admin/login';
  });

  document.querySelector('#category-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await request('/api/categories', {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: String(payload.name || '').trim(),
          parentId: payload.parentId ? Number(payload.parentId) : null
        })
      });
      state.categoryForm = { name: '', parentId: '' };
      await loadAll();
      render();
    } catch (error) {
      setError(error.message || '创建分类失败');
    }
  });

  document.querySelectorAll('[data-delete-category]').forEach((node) => {
    node.addEventListener('click', async () => {
      setError('');
      if (!confirm('确认删除这个分类？')) return;
      try {
        await request(`/api/categories/${node.dataset.deleteCategory}`, {
          method: 'DELETE',
          headers: headers()
        });
        setError('');
        await loadAll();
        render();
      } catch (error) {
        setError(error.message || '删除分类失败');
      }
    });
  });

  bindCategoryTreeDnD();

  document.querySelector('#build-matrix')?.addEventListener('click', () => {
    syncProductFormFromDom();
    syncProductFilesFromInputs();
    const colors = parseOptionList(state.productForm.variantColors);
    const sizes = parseOptionList(state.productForm.variantSizes);
    state.productForm.variants =
      colors.length > 0 && sizes.length > 0
        ? buildVariantMatrix(colors, sizes, state.productForm.variants, state.productForm.defaultVariantStock)
        : [];
    renderVariantMatrix();
  });

  document.querySelector('#product-form input[name="images"]')?.addEventListener('change', () => {
    syncProductFormFromDom();
    syncProductFilesFromInputs();
    render();
  });

  document.querySelector('#product-form input[name="specPdf"]')?.addEventListener('change', () => {
    syncProductFormFromDom();
    syncProductFilesFromInputs();
    render();
  });

  document.querySelector('#product-form input[name="isOnSale"]')?.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const saleInput = document.querySelector('#product-form input[name="salePrice"]');
    if (!(saleInput instanceof HTMLInputElement)) return;
    saleInput.disabled = !target.checked;
    if (!target.checked) saleInput.value = '';
  });

  document.querySelector('#product-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const form = event.currentTarget;
    if (form instanceof HTMLFormElement && !form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const raw = new FormData(form);
    syncProductFilesFromInputs();

    if (state.productForm.variants.length === 0) {
      setError('请先生成库存矩阵并填写库存');
      return;
    }

    const cleanVariants = state.productForm.variants
      .map((item) => ({
        color: String(item.color || '').trim(),
        size: String(item.size || '').trim(),
        stock: Number(item.stock || 0)
      }))
      .filter((item) => item.color && item.size);

    if (cleanVariants.length === 0) {
      setError('库存矩阵不能为空');
      return;
    }

    const submitData = new FormData();
    submitData.append('name', String(raw.get('name') || ''));
    submitData.append('description', String(raw.get('description') || ''));
    const priceCents = Math.round(Number(raw.get('price') || 0) * 100);
    const costCents = Math.round(Number(raw.get('cost') || 0) * 100);
    if (!Number.isFinite(costCents) || costCents < 0) {
      setError('成本价必须大于或等于 0');
      return;
    }
    submitData.append('priceCents', String(priceCents));
    submitData.append('costCents', String(costCents));
    const isOnSale = Boolean(raw.get('isOnSale'));
    submitData.append('isOnSale', isOnSale ? 'true' : 'false');
    if (isOnSale) {
      const salePriceCents = Math.round(Number(raw.get('salePrice') || 0) * 100);
      if (!salePriceCents || salePriceCents <= 0) {
        setError('开启促销时必须填写有效促销价');
        return;
      }
      if (salePriceCents >= priceCents) {
        setError('促销价必须小于原价');
        return;
      }
      submitData.append('salePriceCents', String(salePriceCents));
    }
    submitData.append('categoryId', String(raw.get('categoryId') || ''));
    submitData.append('isActive', raw.get('isActive') ? 'true' : 'false');
    submitData.append('variants', JSON.stringify(cleanVariants));
    const galleryImages = cloneProductFormFiles(state.productForm.pendingImageFiles);
    const hasAtLeastOneImage = galleryImages.some((file) => file && file.size > 0);
    if (!state.productForm.id && !hasAtLeastOneImage) {
      setError('创建商品时至少需要上传 1 张商品图片');
      return;
    }
    galleryImages.forEach((file) => {
      if (file && file.size > 0) submitData.append('images', file);
    });
    const specPdf = state.productForm.pendingSpecPdfFile;
    if (specPdf && specPdf.size > 0) submitData.append('specPdf', specPdf);

    try {
      if (state.productForm.id) {
        await request(`/api/products/${state.productForm.id}`, {
          method: 'PUT',
          headers: headers(),
          body: submitData
        });
      } else {
        await request('/api/products', {
          method: 'POST',
          headers: headers(),
          body: submitData
        });
      }
      state.productForm = initialProductForm();
      await loadAll();
      render();
    } catch (error) {
      setError(error.message || '保存商品失败');
    }
  });

  document.querySelector('#cancel-edit')?.addEventListener('click', () => {
    state.productForm = initialProductForm();
    render();
  });

  document.querySelectorAll('[data-edit-product]').forEach((node) => {
    node.addEventListener('click', () => {
      const product = state.products.find((item) => String(item.id) === String(node.dataset.editProduct));
      if (!product) return;
      state.productForm = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: (Number(product.priceCents || 0) / 100).toFixed(2),
        cost: (Number(product.costCents || 0) / 100).toFixed(2),
        isOnSale: Boolean(product.isOnSale),
        salePrice: Number(product.salePriceCents || 0) > 0 ? (Number(product.salePriceCents || 0) / 100).toFixed(2) : '',
        categoryId: String(product.categoryId || ''),
        isActive: Boolean(product.isActive),
        introPdfUrl: product.introPdfUrl || '',
        imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [],
        pendingImageFiles: [],
        pendingSpecPdfFile: null,
        variantColors: [
          ...new Set((product.variants || []).map((item) => String(item.color || '').trim()).filter(Boolean))
        ].join(', '),
        variantSizes: [
          ...new Set((product.variants || []).map((item) => String(item.size || '').trim()).filter(Boolean))
        ].join(', '),
        defaultVariantStock: 0,
        variants: (product.variants || []).map((item) => ({
          color: item.color,
          size: item.size,
          stock: item.stock,
          sku: item.sku || ''
        }))
      };
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-delete-product]').forEach((node) => {
    node.addEventListener('click', async () => {
      if (!confirm('确认删除这个商品？')) return;
      try {
        await request(`/api/products/${node.dataset.deleteProduct}`, {
          method: 'DELETE',
          headers: headers()
        });
        await loadAll();
        render();
      } catch (error) {
        setError(error.message || '删除商品失败');
      }
    });
  });

  document.querySelectorAll('[data-product-visibility]').forEach((node) => {
    node.addEventListener('change', async () => {
      const id = Number(node.dataset.productVisibility || 0);
      if (!id) return;
      const next = String(node.value || 'true') === 'true';
      try {
        await request(`/api/products/${id}/visibility`, {
          method: 'PATCH',
          headers: headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ isActive: next })
        });
        await loadAll();
        render();
      } catch (error) {
        setError(error.message || '更新商品状态失败');
      }
    });
  });

  document.querySelectorAll('[data-product-sale-enabled]').forEach((node) => {
    node.addEventListener('change', () => {
      const id = Number(node.dataset.productSaleEnabled || 0);
      if (!id) return;
      const input = document.querySelector(`[data-product-sale-price="${id}"]`);
      if (!input) return;
      const enabled = String(node.value || 'false') === 'true';
      input.disabled = !enabled;
      if (!enabled) input.value = '';
    });
  });

  document.querySelectorAll('[data-product-sale-save]').forEach((node) => {
    node.addEventListener('click', async () => {
      const id = Number(node.dataset.productSaleSave || 0);
      if (!id) return;
      const product = state.products.find((item) => Number(item.id) === id);
      if (!product) return;
      const enabledSelect = document.querySelector(`[data-product-sale-enabled="${id}"]`);
      const priceInput = document.querySelector(`[data-product-sale-price="${id}"]`);
      if (!enabledSelect || !priceInput) return;
      const isOnSale = String(enabledSelect.value || 'false') === 'true';
      const payload = { isOnSale };
      if (isOnSale) {
        const cents = Math.round(Number(priceInput.value || 0) * 100);
        if (!cents || cents <= 0) {
          setError('促销价必须大于 0');
          return;
        }
        if (cents >= Number(product.priceCents || 0)) {
          setError('促销价必须小于原价');
          return;
        }
        payload.salePriceCents = cents;
      }
      try {
        await request(`/api/products/${id}`, {
          method: 'PUT',
          headers: headers(),
          body: (() => {
            const fd = new FormData();
            fd.append('isOnSale', payload.isOnSale ? 'true' : 'false');
            if (payload.isOnSale) fd.append('salePriceCents', String(payload.salePriceCents));
            return fd;
          })()
        });
        await loadAll();
        render();
      } catch (error) {
        setError(error.message || '更新促销状态失败');
      }
    });
  });

  document.querySelectorAll('[data-set-home-feature]').forEach((node) => {
    node.addEventListener('click', async () => {
      const id = Number(node.dataset.setHomeFeature || 0);
      if (!id) return;
      const product = state.products.find((item) => Number(item.id) === id);
      if (!product) return;
      const next = !Boolean(product.isHomeFeatured);
      try {
        await request(`/api/products/${id}/home-feature`, {
          method: 'PATCH',
          headers: headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ isHomeFeatured: next })
        });
        await loadAll();
        render();
      } catch (error) {
        setError(error.message || '更新首页主推失败');
      }
    });
  });

  document.querySelector('#sku-search-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.skuSearch = String(formData.get('skuSearch') || '').trim();
    await loadAll();
    render();
  });

  document.querySelector('#clear-sku-search')?.addEventListener('click', async () => {
    state.skuSearch = '';
    await loadAll();
    render();
  });

  document.querySelector('#sales-month-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = new FormData(event.currentTarget);
    const month = String(payload.get('salesMonth') || '').trim();
    if (!month) return;
    state.salesMonth = month;
    try {
      if (hasPermission(PERMISSION.SALES_REPORTS)) {
        state.salesSummary = await request(`/api/orders/sales-summary?month=${encodeURIComponent(month)}`, {
          headers: headers()
        });
      }
      render();
    } catch (error) {
      setError(error.message || '加载销售汇总失败');
    }
  });

  bindOrderEvents();
  bindVariantStockInputs();
  restoreProductFilesToInputs();
}

async function init() {
  try {
    await loadAdminProfile();
    await loadAll();
    render();
    if (!autoRefreshTimer && hasPermission(PERMISSION.ORDERS)) {
      let lastSnapshot = ordersSnapshot(state.orders, state.orderHistory);
      autoRefreshTimer = window.setInterval(async () => {
        try {
          const active = document.activeElement;
          const editingProductForm =
            Boolean(state.productForm.id) ||
            (active && active.closest && active.closest('#product-form'));
          if (editingProductForm || document.hidden) return;
          const [orders, orderHistory] = await Promise.all([
            request('/api/orders', { headers: headers() }),
            request('/api/orders/history', { headers: headers() })
          ]);
          const nextOrders = orders || [];
          const nextHistory = orderHistory || [];
          const nextSnapshot = ordersSnapshot(nextOrders, nextHistory);
          if (nextSnapshot === lastSnapshot) return;
          state.orders = nextOrders;
          state.orderHistory = nextHistory;
          lastSnapshot = nextSnapshot;
          refreshOrderTablesOnly();
        } catch {
          // keep silent during polling
        }
      }, 8000);
    }
  } catch (error) {
    setError(error.message || '加载后台数据失败');
    if (/Unauthorized|Forbidden/i.test(String(error.message || ''))) {
      setAdminToken('');
      location.href = '/admin/login';
    }
  }
}

init();
