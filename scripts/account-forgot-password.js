import { renderHeader, request, t } from './common.js';

function localize() {
  document.title = `${t('forgot_password') || 'Forgot Password'} | Luxury Station`;
  document.querySelector('.hero-kicker')?.replaceChildren(document.createTextNode(t('account_security')));
  const heading = document.querySelector('#forgot-password-form h1');
  if (heading) heading.textContent = t('reset_password');
  const sub = document.querySelector('#forgot-password-form .checkout-subline');
  if (sub) sub.textContent = t('verify_email_phone_postal');
  const labels = document.querySelectorAll('#forgot-password-form label');
  const texts = [t('email') || 'Email', t('phone'), t('postal_code'), t('new_password')];
  labels.forEach((label, idx) => {
    if (texts[idx]) label.childNodes[0].textContent = texts[idx];
  });
  const submit = document.querySelector('#forgot-password-form button[type="submit"]');
  if (submit) submit.textContent = t('reset_password');
  const back = document.querySelector('#forgot-password-form .auth-foot-note a');
  if (back) back.textContent = t('back_to_login');
}

async function init() {
  await renderHeader();
  localize();
  const form = document.querySelector('#forgot-password-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const err = document.querySelector('#forgot-error');
    const ok = document.querySelector('#forgot-success');
    err.style.display = 'none';
    ok.style.display = 'none';

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const data = await request('/api/auth/customer/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      ok.textContent = data?.message || (t('password_reset_success') || 'Password reset successful. You can log in now.');
      ok.style.display = 'block';
      form.reset();
    } catch (error) {
      err.textContent = error.message || (t('password_reset_failed') || 'Password reset failed');
      err.style.display = 'block';
    }
  });
}

init();
