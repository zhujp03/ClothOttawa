import { renderHeader, request, setCustomerSession, t } from './common.js';

function localize() {
  document.title = `${t('header_log_in')} | Luxury Station`;
  document.querySelector('.hero-kicker')?.replaceChildren(document.createTextNode(t('customer_account')));
  const heading = document.querySelector('#customer-login-form h1');
  if (heading) heading.textContent = t('login_to_continue');
  const labels = document.querySelectorAll('#customer-login-form label');
  if (labels[0]) labels[0].childNodes[0].textContent = `${t('email') || 'Email'}`;
  if (labels[1]) labels[1].childNodes[0].textContent = `${t('password') || 'Password'}`;
  const forgot = document.querySelector('#customer-login-form .auth-foot-note a');
  if (forgot) forgot.textContent = t('forgot_password') || 'Forgot password?';
  const submit = document.querySelector('#customer-login-form button[type="submit"]');
  if (submit) submit.textContent = t('header_log_in');
  const signUp = document.querySelector('#signup-note');
  if (signUp) signUp.innerHTML = `${t('new_here') || 'New here?'} <a href="/account/register" class="inline-link">${t('header_sign_up')}</a>`;
}

async function init() {
  await renderHeader();
  localize();
  const form = document.querySelector('#customer-login-form');
  if (!form) return;
  const errorBox = document.querySelector('#login-error');
  const successBox = document.querySelector('#login-success');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const data = await request('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setCustomerSession(data.token, data.customer);
      location.href = '/account';
    } catch (error) {
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        errorBox.textContent = t('email_not_verified') || 'Please verify your email before logging in.';
      } else if (error.code === 'ACCOUNT_SUSPENDED') {
        errorBox.textContent = t('account_suspended') || 'This account has been suspended or is not valid.';
      } else {
        errorBox.textContent = error.message || (t('login_failed') || 'Login failed');
      }
      errorBox.style.display = 'block';
    }
  });

}

init();
