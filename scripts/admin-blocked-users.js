import { request, getAdminToken, setAdminToken } from './common.js';

const token = getAdminToken();
if (!token) location.href = '/admin/login';
let autoRefreshTimer = null;
let adminProfile = null;

function headers() {
  return {
    Authorization: `Bearer ${token}`
  };
}

async function loadAdminProfile() {
  const data = await request('/api/auth/admin/me', { headers: headers() });
  adminProfile = data?.admin || null;
}

function hasPermission(permission) {
  return Array.isArray(adminProfile?.permissions) && adminProfile.permissions.includes(permission);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function fullName(customer = {}) {
  return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-';
}

function fullAddress(customer = {}) {
  const local = [customer.city, customer.province, customer.postalCode].filter(Boolean).join(', ');
  return [customer.addressLine1, customer.addressLine2, local, customer.country].filter(Boolean).join(' | ') || '-';
}

async function fetchBlockedCustomers(query = '') {
  const search = String(query || '').trim();
  const path = `/api/customers/blocked${search ? `?query=${encodeURIComponent(search)}` : ''}`;
  return request(path, { headers: headers() });
}

function renderList(customers = []) {
  const wrap = document.querySelector('#blocked-users-wrap');
  if (!wrap) return;

  if (!Array.isArray(customers) || customers.length === 0) {
    wrap.innerHTML = '<p class="empty-state">当前没有被拉黑的用户。</p>';
    return;
  }

  wrap.innerHTML = `
    <div class="contact-admin-list">
      ${customers
        .map(
          (customer) => `
        <article class="contact-admin-card">
          <div class="contact-admin-head">
            <h3>${escapeHtml(fullName(customer))}</h3>
            <span class="table-subline">拉黑时间：${formatTime(customer.suspendedAt)}</span>
          </div>
          <div class="contact-admin-meta">
            <p><strong>邮箱：</strong>${escapeHtml(customer.email || '-')}</p>
            <p><strong>电话：</strong>${escapeHtml(customer.phone || '-')}</p>
            <p><strong>地址：</strong>${escapeHtml(fullAddress(customer))}</p>
          </div>
          <div class="contact-admin-message">
            <p><strong>用户 ID：</strong>${customer.id}</p>
            <p><strong>原因：</strong>${escapeHtml(customer.suspendedReason || 'Suspended by admin')}</p>
            <div class="admin-messages-actions">
              <button type="button" class="ghost-btn" data-user-action="unsuspend" data-user-id="${customer.id}" data-user-name="${escapeHtml(fullName(customer))}">解除拉黑</button>
            </div>
          </div>
        </article>
      `
        )
        .join('')}
    </div>
  `;
}

async function loadAndRender(query = '') {
  const wrap = document.querySelector('#blocked-users-wrap');
  if (wrap) wrap.innerHTML = '<p class="empty-state">加载中...</p>';
  const customers = await fetchBlockedCustomers(query);
  renderList(customers);
}

async function init() {
  const root = document.querySelector('#admin-blocked-users-root');
  if (!root) return;

  await loadAdminProfile();
  if (!hasPermission('customers')) {
    location.href = '/admin';
    return;
  }

  root.innerHTML = `
    <section class="admin-shell">
      <div class="admin-topbar">
        <div>
          <h1>被拉黑列表</h1>
          <p>仅显示已被拉黑（suspended）的用户，可在此一键解除拉黑。</p>
        </div>
        <div class="admin-messages-actions">
          <a href="/admin" class="ghost-btn admin-link-btn">返回后台首页</a>
          <a href="/admin/messages" class="ghost-btn admin-link-btn">消息中心</a>
          ${hasPermission('sales_reports') ? '<a href="/admin#sales-summary-panel" class="ghost-btn admin-link-btn">销售汇总</a>' : ''}
          <a href="/admin/users" class="ghost-btn admin-link-btn">用户列表</a>
          <button type="button" class="danger-ghost" id="admin-logout">退出登录</button>
        </div>
      </div>

      <div class="panel">
        <form id="blocked-user-search-form" class="admin-user-search-form">
          <label for="blocked-user-search-input">搜索被拉黑用户（姓名 / 邮箱 / 手机号）</label>
          <div class="admin-user-search-row">
            <input id="blocked-user-search-input" name="query" placeholder="例如：Michael / 1383@gmail.com / 613..." />
            <button type="submit" class="ghost-btn">搜索</button>
            <button type="button" class="danger-ghost" id="blocked-user-search-reset">清除</button>
          </div>
        </form>
      </div>

      <div id="blocked-users-wrap" class="panel"><p class="empty-state">加载中...</p></div>
    </section>
  `;

  document.querySelector('#admin-logout')?.addEventListener('click', () => {
    setAdminToken('');
    location.href = '/admin/login';
  });

  document.querySelector('#blocked-user-search-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get('query') || '').trim();
    try {
      await loadAndRender(query);
    } catch (error) {
      const wrap = document.querySelector('#blocked-users-wrap');
      if (wrap) wrap.innerHTML = `<p class="admin-error">${error.message || '搜索失败'}</p>`;
    }
  });

  document.querySelector('#blocked-user-search-reset')?.addEventListener('click', async () => {
    const input = document.querySelector('#blocked-user-search-input');
    if (input) input.value = '';
    try {
      await loadAndRender('');
    } catch (error) {
      const wrap = document.querySelector('#blocked-users-wrap');
      if (wrap) wrap.innerHTML = `<p class="admin-error">${error.message || '加载失败'}</p>`;
    }
  });

  document.querySelector('#blocked-users-wrap')?.addEventListener('click', async (event) => {
    const actionBtn = event.target.closest('[data-user-action="unsuspend"]');
    if (!actionBtn) return;

    const userId = Number(actionBtn.dataset.userId || 0);
    const userName = String(actionBtn.dataset.userName || '该用户');
    if (!userId) return;

    const ok = window.confirm(`确认解除 ${userName} 的拉黑状态吗？`);
    if (!ok) return;

    try {
      await request(`/api/customers/${userId}/unsuspend`, {
        method: 'POST',
        headers: headers()
      });
      const currentQuery = String(document.querySelector('#blocked-user-search-input')?.value || '').trim();
      await loadAndRender(currentQuery);
    } catch (error) {
      const wrap = document.querySelector('#blocked-users-wrap');
      if (wrap) wrap.innerHTML = `<p class="admin-error">${error.message || '操作失败'}</p>`;
    }
  });

  try {
    await loadAndRender('');
    if (!autoRefreshTimer) {
      autoRefreshTimer = window.setInterval(async () => {
        try {
          if (document.hidden) return;
          const active = document.activeElement;
          const inSearch = active && active.closest && active.closest('#blocked-user-search-form');
          if (inSearch) return;
          const currentQuery = String(document.querySelector('#blocked-user-search-input')?.value || '').trim();
          await loadAndRender(currentQuery);
        } catch {
          // ignore polling errors
        }
      }, 8000);
    }
  } catch (error) {
    const wrap = document.querySelector('#blocked-users-wrap');
    if (wrap) wrap.innerHTML = `<p class="admin-error">${error.message || '加载被拉黑用户失败'}</p>`;
    if (/Unauthorized|Forbidden/i.test(String(error.message || ''))) {
      setAdminToken('');
      location.href = '/admin/login';
    }
  }
}

init().catch((error) => {
  if (/Unauthorized|Forbidden/i.test(String(error.message || ''))) {
    setAdminToken('');
    location.href = '/admin/login';
  }
});
