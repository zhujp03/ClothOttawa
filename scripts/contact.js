import { renderHeader, getCustomerSession, request, t } from './common.js';

async function init() {
  await renderHeader();
  const root = document.querySelector('#contact-root');
  if (!root) return;

  const { token, customer } = getCustomerSession();

  root.innerHTML = `
    <section class="contact-shell">
      <article class="panel contact-panel">
        <p class="hero-kicker">${t('contact_us')}</p>
        <h1>${t('reply_24h')}</h1>
        <p class="contact-phone">${t('call_us')} <strong>+44 7404822411</strong></p>
        ${
          customer
            ? `<p class="checkout-subline">${t('logged_in_as', { email: customer.email })}</p>`
            : `<p class="checkout-subline">${t('login_to_leave_message')}</p>`
        }
        <p id="contact-error" class="admin-error" style="display:none;"></p>
        <p id="contact-success" class="admin-success" style="display:none;"></p>
        <form id="contact-form" class="contact-form">
          <label for="contact-message">${t('leave_message')}</label>
          <textarea id="contact-message" name="message" minlength="3" maxlength="3000" required placeholder="${t('message_placeholder')}"></textarea>
          <button type="submit" ${customer ? '' : 'disabled'}>${customer ? t('send_message') : t('login_required')}</button>
        </form>
      </article>
    </section>
  `;

  if (!customer || !token) return;

  document.querySelector('#contact-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const err = document.querySelector('#contact-error');
    const ok = document.querySelector('#contact-success');
    const submitBtn = form.querySelector('button[type="submit"]');
    err.style.display = 'none';
    ok.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = t('sending');

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      await request('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: String(payload.message || '').trim() })
      });
      ok.textContent = t('message_sent_success');
      ok.style.display = 'block';
      form.reset();
    } catch (error) {
      err.textContent = error.message || t('failed_send_message');
      err.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t('send_message');
    }
  });
}

init();
