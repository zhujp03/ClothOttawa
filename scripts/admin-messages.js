import { request, getAdminToken, setAdminToken } from './common.js';

const token = getAdminToken();
if (!token) location.href = '/admin/login';
let autoRefreshTimer = null;
let adminProfile = null;

function headers() {
  return { Authorization: `Bearer ${token}` };
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

function gmailReplyLink(toEmail, customerName, message) {
  const subject = encodeURIComponent(`Luxury Station 客服回复 - ${customerName}`);
  const body = encodeURIComponent(
    `Hi ${customerName},\n\nThank you for contacting Luxury Station.\n\nYour message:\n${message}\n\nBest regards,\nLuxury Station Support`
  );
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${subject}&body=${body}`;
}

function customerOverview(customer = {}) {
  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || '-';
  const fullAddress = [
    customer.addressLine1,
    customer.addressLine2,
    [customer.city, customer.province, customer.postalCode].filter(Boolean).join(', '),
    customer.country
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    fullName,
    email: customer.email || '-',
    phone: customer.phone || '-',
    address: fullAddress || '-'
  };
}

function formatTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

async function fetchMessages() {
  return request('/api/messages', { headers: headers() });
}

function bindDeleteEvents() {
  document.querySelectorAll('[data-delete-message-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = Number(button.dataset.deleteMessageId || 0);
      if (!id) return;
      if (!confirm('确认删除这条已处理消息？')) return;
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = '删除中...';
      try {
        await request(`/api/messages/${id}`, {
          method: 'DELETE',
          headers: headers()
        });
        await renderMessages();
      } catch (error) {
        alert(error.message || '删除消息失败');
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
}

async function renderMessages() {
  const wrap = document.querySelector('#messages-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<p class="empty-state">加载中...</p>';

  const messages = await fetchMessages();

  if (!Array.isArray(messages) || messages.length === 0) {
    wrap.innerHTML = '<p class="empty-state">暂无客户消息。</p>';
    return;
  }

  wrap.innerHTML = `
    <div class="contact-admin-list">
      ${messages
        .map((item) => {
          const info = customerOverview(item.customer || {});
          const link = gmailReplyLink(info.email, info.fullName === '-' ? 'Customer' : info.fullName, item.message || '');
          const safeName = escapeHtml(info.fullName);
          const safeEmail = escapeHtml(info.email);
          const safePhone = escapeHtml(info.phone);
          const safeAddress = escapeHtml(info.address);
          const safeMessage = escapeHtml(item.message || '').replace(/\n/g, '<br/>');
          return `
            <article class="contact-admin-card">
              <div class="contact-admin-head">
                <h3>${safeName}</h3>
                <span class="table-subline">${formatTime(item.createdAt)}</span>
              </div>
              <div class="contact-admin-meta">
                <p><strong>邮箱：</strong>${safeEmail}</p>
                <p><strong>电话：</strong>${safePhone}</p>
                <p><strong>地址：</strong>${safeAddress}</p>
              </div>
              <div class="contact-admin-message">
                <p><strong>用户留言：</strong></p>
                <p>${safeMessage}</p>
              </div>
              <div class="contact-admin-actions">
                <a class="cta-button contact-reply-btn" href="${link}" target="_blank" rel="noopener">回复</a>
                <button type="button" class="danger-ghost" data-delete-message-id="${item.id}">删除</button>
              </div>
            </article>
          `;
        })
        .join('')}
    </div>
  `;

  bindDeleteEvents();
}

function renderPageShell() {
  const root = document.querySelector('#admin-messages-root');
  if (!root) return;
  root.innerHTML = `
    <section class="admin-shell">
      <div class="admin-topbar">
        <div>
          <h1>客户消息中心</h1>
          <p>查看所有来自用户端 Contact Us 的消息，包含用户信息概览并可一键跳转 Gmail 回复。</p>
        </div>
        <div class="admin-messages-actions">
          <a href="/admin" class="ghost-btn admin-link-btn">返回后台首页</a>
          ${hasPermission('sales_reports') ? '<a href="/admin#sales-summary-panel" class="ghost-btn admin-link-btn">销售汇总</a>' : ''}
          ${hasPermission('customers') ? '<a href="/admin/users" class="ghost-btn admin-link-btn">用户列表</a>' : ''}
          ${hasPermission('customers') ? '<a href="/admin/blocked-users" class="ghost-btn admin-link-btn">被拉黑列表</a>' : ''}
          <button type="button" class="danger-ghost" id="admin-logout">退出登录</button>
        </div>
      </div>
      <div id="messages-wrap" class="panel"><p class="empty-state">加载中...</p></div>
    </section>
  `;

  document.querySelector('#admin-logout')?.addEventListener('click', () => {
    setAdminToken('');
    location.href = '/admin/login';
  });
}

async function init() {
  try {
    await loadAdminProfile();
    if (!hasPermission('messages')) {
      location.href = '/admin';
      return;
    }

    renderPageShell();
    await renderMessages();

    if (!autoRefreshTimer) {
      autoRefreshTimer = window.setInterval(async () => {
        try {
          if (document.hidden) return;
          await renderMessages();
        } catch {
          // ignore polling errors
        }
      }, 8000);
    }
  } catch (error) {
    const root = document.querySelector('#admin-messages-root');
    if (root) root.innerHTML = `<p class="admin-error">${error.message || '加载消息失败'}</p>`;
    if (/Unauthorized|Forbidden/i.test(String(error.message || ''))) {
      setAdminToken('');
      location.href = '/admin/login';
    }
  }
}

init();
