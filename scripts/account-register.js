import { renderHeader, request, t } from './common.js';

const state = {
  reference: null
};

function localize() {
  document.title = `${t('header_sign_up')} | Luxury Station`;
  document.querySelector('.hero-kicker')?.replaceChildren(document.createTextNode(t('customer_account')));
  const heading = document.querySelector('#customer-register-form h1');
  if (heading) heading.textContent = t('create_account');

  const map = {
    firstName: t('first_name'),
    lastName: t('last_name'),
    email: t('email') || 'Email',
    password: t('password') || 'Password',
    confirmPassword: t('confirm_password') || 'Confirm Password',
    phone: t('phone'),
    country: t('country'),
    addressLine1: t('address_line_1'),
    addressLine2: t('address_line_2_optional'),
    city: t('city'),
    province: t('province_state'),
    postalCode: t('postal_code')
  };

  Object.entries(map).forEach(([name, text]) => {
    const input = document.querySelector(`#customer-register-form [name="${name}"]`);
    const label = input?.closest('label');
    if (label?.childNodes?.[0]) label.childNodes[0].textContent = text;
  });

  const terms = document.querySelector('#customer-register-form .terms-check span');
  if (terms) terms.textContent = t('terms_agree');
  const submit = document.querySelector('#customer-register-form button[type="submit"]');
  if (submit) submit.textContent = t('header_sign_up');
  const addressNote = document.querySelector('#register-real-address-note');
  if (addressNote) addressNote.textContent = t('register_real_address_note');
  const loginNote = document.querySelector('#register-login-note');
  if (loginNote) {
    loginNote.innerHTML = `${t('already_have_account')} <a href="/account/login" class="inline-link">${t('header_log_in')}</a>`;
  }
}

function normalize(text = '') {
  return String(text).trim().toLowerCase();
}

function findCountry(countryName = '') {
  const countries = Array.isArray(state.reference?.countries) ? state.reference.countries : [];
  const key = normalize(countryName);
  return countries.find((item) => normalize(item.name) === key || normalize(item.code) === key) || countries[0] || null;
}

function toOptionsHtml(rows = [], valueKey = 'value', labelKey = 'label') {
  return rows.map((row) => `<option value="${row[valueKey]}">${row[labelKey]}</option>`).join('');
}

function setupCountryProvinceControls() {
  const countrySelect = document.querySelector('#register-country');
  const regionSelect = document.querySelector('#register-province-select');
  const regionLabel = document.querySelector('#register-province-select-wrap');
  const regionInputWrap = document.querySelector('#register-province-input-wrap');
  const regionInput = document.querySelector('#register-province-input');
  const countryInputWrap = document.querySelector('#register-country-input-wrap');
  const countryInput = document.querySelector('#register-country-input');

  if (!countrySelect || !regionSelect || !regionLabel || !regionInputWrap || !regionInput || !countryInputWrap || !countryInput) return;

  const countries = Array.isArray(state.reference?.countries) ? state.reference.countries : [];
  const sortedCountries = [...countries].sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return String(a.name).localeCompare(String(b.name));
  });

  countrySelect.innerHTML = sortedCountries
    .map((country) => ({
      value: country.name,
      label: country.popular ? `${country.name} (Most popular)` : country.name
    }))
    .map((row) => `<option value="${row.value}">${row.label}</option>`)
    .join('');

  if (!sortedCountries.length) {
    countrySelect.value = 'Other';
    countryInputWrap.style.display = '';
    regionInputWrap.style.display = '';
    regionLabel.style.display = 'none';
    countryInput.required = true;
    regionInput.required = true;
    regionSelect.required = false;
    return;
  }

  const defaultCountry = sortedCountries.find((item) => item.popular) || sortedCountries[0];
  if (!defaultCountry) return;
  countrySelect.value = defaultCountry.name;

  function syncRegions() {
    const country = findCountry(countrySelect.value);
    if (!country) return;
    const isOther = normalize(country.name) === 'other' || normalize(country.code) === 'other';
    const labelText = country.regionLabel || t('province_state');
    if (regionLabel.childNodes[0]) regionLabel.childNodes[0].textContent = labelText;

    if (isOther) {
      countryInputWrap.style.display = '';
      regionInputWrap.style.display = '';
      regionLabel.style.display = 'none';
      countryInput.required = true;
      regionInput.required = true;
      regionSelect.required = false;
      return;
    }

    countryInputWrap.style.display = 'none';
    regionInputWrap.style.display = 'none';
    regionLabel.style.display = '';
    countryInput.required = false;
    regionInput.required = false;
    regionSelect.required = true;
    regionSelect.innerHTML = toOptionsHtml(country.regions || [], 'name', 'name');
    regionSelect.value = country.regions?.[0]?.name || '';
  }

  countrySelect.addEventListener('change', syncRegions);

  syncRegions();
}

async function init() {
  await renderHeader();
  localize();

  try {
    state.reference = await request('/api/tax/reference');
  } catch {
    state.reference = { countries: [] };
  }
  setupCountryProvinceControls();

  const form = document.querySelector('#customer-register-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = document.querySelector('#register-error');
    const successBox = document.querySelector('#register-success');
    errorBox.style.display = 'none';
    successBox.style.display = 'none';

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.acceptedTerms = payload.acceptedTerms === 'on';

    if (normalize(payload.country) === 'other') {
      payload.country = String(payload.countryManual || '').trim();
      payload.province = String(payload.provinceManual || '').trim();
    } else {
      payload.country = String(payload.country || '').trim();
      payload.province = String(payload.province || '').trim();
    }
    delete payload.countryManual;
    delete payload.provinceManual;

    if (String(payload.password || '') !== String(payload.confirmPassword || '')) {
      errorBox.textContent = t('password_mismatch') || 'Passwords do not match.';
      errorBox.style.display = 'block';
      return;
    }

    if (!payload.country || !payload.province) {
      errorBox.textContent = 'Please provide both country and province/state.';
      errorBox.style.display = 'block';
      return;
    }

    try {
      const data = await request('/api/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const email = encodeURIComponent(String(payload.email || '').trim().toLowerCase());
      const debugToken = data?.debugVerifyUrl ? encodeURIComponent(String(data.debugVerifyUrl)) : '';
      const next = `/account/verify-email?mode=sent&email=${email}${debugToken ? `&debugVerifyUrl=${debugToken}` : ''}`;
      location.href = next;
    } catch (error) {
      errorBox.textContent = error.message || (t('registration_failed') || 'Registration failed');
      errorBox.style.display = 'block';
    }
  });
}

init();
