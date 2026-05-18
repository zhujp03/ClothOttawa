import { renderHeader, request, t } from './common.js';

function localize() {
  document.title = `${t('verify_email') || 'Email Verification'} | Luxury Station`;
  document.querySelector('.hero-kicker')?.replaceChildren(document.createTextNode(t('account_security')));
}

function setState({ title, message, error, success, showActions }) {
  const titleNode = document.querySelector('#verify-title');
  const messageNode = document.querySelector('#verify-message');
  const errorNode = document.querySelector('#verify-error');
  const successNode = document.querySelector('#verify-success');
  const actions = document.querySelector('#verify-actions');

  if (titleNode && title) titleNode.textContent = title;
  if (messageNode && message) messageNode.textContent = message;

  if (errorNode) {
    errorNode.style.display = error ? 'block' : 'none';
    errorNode.textContent = error || '';
  }

  if (successNode) {
    successNode.style.display = success ? 'block' : 'none';
    successNode.textContent = success || '';
  }

  if (actions) actions.style.display = showActions ? 'flex' : 'none';
}

async function init() {
  await renderHeader();
  localize();

  const query = new URLSearchParams(window.location.search);
  const mode = String(query.get('mode') || '').trim();
  const email = String(query.get('email') || '').trim();
  const debugVerifyUrl = String(query.get('debugVerifyUrl') || '').trim();
  const token = query.get('token');

  if (mode === 'sent') {
    setState({
      title: t('verify_email_sent_title') || 'Please verify your email',
      message:
        t('verify_email_sent_message') ||
        `We sent a verification email to ${email || 'your inbox'}. Please click the link in that email before logging in.`,
      success: email ? `Verification email target: ${email}` : '',
      showActions: true
    });

    if (debugVerifyUrl) {
      const actions = document.querySelector('#verify-actions');
      if (actions) {
        const debugLink = document.createElement('a');
        debugLink.href = debugVerifyUrl;
        debugLink.target = '_blank';
        debugLink.rel = 'noreferrer';
        debugLink.className = 'ghost-btn';
        debugLink.textContent = 'Open debug verify link';
        actions.appendChild(debugLink);
      }
    }
    return;
  }

  if (!token) {
    setState({
      title: t('verify_email_missing_title') || 'Invalid verification link',
      message: t('verify_email_missing_message') || 'This link is missing a token.',
      error: t('verify_email_missing_error') || 'Please request a new verification email from the login page.',
      showActions: true
    });
    return;
  }

  try {
    await request('/api/auth/customer/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });

    setState({
      title: t('verify_email_success_title') || 'Email verified successfully',
      message: t('verify_email_success_message') || 'Your account is now active. You can log in.',
      success: t('verify_email_success_alert') || 'Verification complete.',
      showActions: true
    });
  } catch (error) {
    setState({
      title: t('verify_email_failed_title') || 'Verification failed',
      message: t('verify_email_failed_message') || 'Your verification link is invalid or expired.',
      error: error.message || (t('verify_email_failed_error') || 'Please request a new verification email.'),
      showActions: true
    });
  }
}

init();
