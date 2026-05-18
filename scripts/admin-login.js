import { request, setAdminToken } from './common.js';

async function init() {
  const form = document.querySelector('#admin-login-form');
  if (!form) return;
  const usernameInput = form.querySelector('input[name="username"]');
  const passwordInput = form.querySelector('input[name="password"]');
  form.reset();
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = document.querySelector('#admin-login-error');
    errorBox.style.display = 'none';
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setAdminToken(data.token || '');
      location.href = '/admin';
    } catch (error) {
      errorBox.textContent = error.message || '登录失败';
      errorBox.style.display = 'block';
    }
  });
}

init();
