import {
  renderHeader,
  request,
  getCustomerSession,
  setCustomerSession,
  clearCustomerSession,
  t
} from './common.js';

const state = {
  taxReference: null
};

function profileFromCustomer(customer) {
  return {
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
    addressLine1: customer?.addressLine1 || '',
    addressLine2: customer?.addressLine2 || '',
    city: customer?.city || '',
    province: customer?.province || '',
    postalCode: customer?.postalCode || '',
    country: customer?.country || 'Canada'
  };
}

function normalize(text = '') {
  return String(text).trim().toLowerCase();
}

function findCountry(countryName = '') {
  const countries = Array.isArray(state.taxReference?.countries) ? state.taxReference.countries : [];
  const key = normalize(countryName);
  return countries.find((item) => normalize(item.name) === key || normalize(item.code) === key) || null;
}

function toOptionsHtml(rows = [], valueKey = 'value', labelKey = 'label') {
  return rows.map((row) => `<option value="${row[valueKey]}">${row[labelKey]}</option>`).join('');
}

function setupProfileCountryProvinceControls(profile) {
  const countrySelect = document.querySelector('#account-country-select');
  const countryInputWrap = document.querySelector('#account-country-input-wrap');
  const countryInput = document.querySelector('#account-country-input');
  const regionSelectWrap = document.querySelector('#account-province-select-wrap');
  const regionSelect = document.querySelector('#account-province-select');
  const regionInputWrap = document.querySelector('#account-province-input-wrap');
  const regionInput = document.querySelector('#account-province-input');

  if (
    !countrySelect ||
    !countryInputWrap ||
    !countryInput ||
    !regionSelectWrap ||
    !regionSelect ||
    !regionInputWrap ||
    !regionInput
  ) {
    return;
  }

  const countries = Array.isArray(state.taxReference?.countries) ? state.taxReference.countries : [];
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
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
    .join('');

  if (!sortedCountries.length) {
    countrySelect.innerHTML = '<option value="Other">Other</option>';
    countrySelect.value = 'Other';
    countryInputWrap.style.display = '';
    regionInputWrap.style.display = '';
    regionSelectWrap.style.display = 'none';
    countryInput.required = true;
    regionInput.required = true;
    regionSelect.required = false;
    countryInput.value = profile.country || '';
    regionInput.value = profile.province || '';
    return;
  }

  function syncRegions() {
    const selected = findCountry(countrySelect.value);
    if (!selected) return;
    const labelText = selected.regionLabel || t('province_state');
    if (regionSelectWrap.childNodes[0]) regionSelectWrap.childNodes[0].textContent = labelText;
    if (regionInputWrap.childNodes[0]) regionInputWrap.childNodes[0].textContent = labelText;

    const isOther = normalize(selected.name) === 'other' || normalize(selected.code) === 'other';
    if (isOther) {
      countryInputWrap.style.display = '';
      regionInputWrap.style.display = '';
      regionSelectWrap.style.display = 'none';
      countryInput.required = true;
      regionInput.required = true;
      regionSelect.required = false;
      return;
    }

    countryInputWrap.style.display = 'none';
    regionInputWrap.style.display = 'none';
    regionSelectWrap.style.display = '';
    countryInput.required = false;
    regionInput.required = false;
    regionSelect.required = true;
    regionSelect.innerHTML = toOptionsHtml(selected.regions || [], 'name', 'name');
    regionSelect.value = selected.regions?.[0]?.name || '';
  }

  const matchedCountry = findCountry(profile.country);
  if (matchedCountry && normalize(matchedCountry.name) !== 'other') {
    countrySelect.value = matchedCountry.name;
    syncRegions();
    const regionMatch = (matchedCountry.regions || []).find((item) => normalize(item.name) === normalize(profile.province));
    if (regionMatch) {
      regionSelect.value = regionMatch.name;
    }
  } else {
    countrySelect.value = 'Other';
    syncRegions();
    countryInput.value = profile.country || '';
    regionInput.value = profile.province || '';
  }

  countrySelect.addEventListener('change', () => {
    syncRegions();
    if (normalize(countrySelect.value) === 'other') {
      countryInput.value = '';
      regionInput.value = '';
    }
  });
}

async function init() {
  await renderHeader();
  const root = document.querySelector('#account-root');
  if (!root) return;

  const { token, customer } = getCustomerSession();
  const loggedIn = Boolean(token && customer);
  const profile = profileFromCustomer(customer);

  root.innerHTML = `
    <section class="account-page">
      ${
        loggedIn
          ? `
        <form class="panel account-form" id="account-form">
          <h1>${t('my_account')}</h1>
          <p class="checkout-subline">${customer.email}</p>
          <p id="account-error" class="admin-error" style="display:none;"></p>
          <p id="account-success" class="admin-success" style="display:none;"></p>
          <div class="form-columns two-col">
            <label>${t('first_name')}<input name="firstName" required value="${profile.firstName}" /></label>
            <label>${t('last_name')}<input name="lastName" required value="${profile.lastName}" /></label>
            <label>${t('phone')}<input name="phone" required value="${profile.phone}" /></label>
            <label>${t('country')}
              <select name="country" id="account-country-select" required></select>
            </label>
            <label id="account-country-input-wrap" style="display:none;">${t('country')} (Other)
              <input name="countryManual" id="account-country-input" />
            </label>
            <label class="span-2">${t('address_line_1')}<input name="addressLine1" required value="${profile.addressLine1}" /></label>
            <label class="span-2">${t('address_line_2')}<input name="addressLine2" value="${profile.addressLine2}" /></label>
            <label>${t('city')}<input name="city" required value="${profile.city}" /></label>
            <label id="account-province-select-wrap">${t('province_state')}
              <select name="province" id="account-province-select" required></select>
            </label>
            <label id="account-province-input-wrap" style="display:none;">${t('province_state')}
              <input name="provinceManual" id="account-province-input" />
            </label>
            <label>${t('postal_code')}<input name="postalCode" required value="${profile.postalCode}" /></label>
          </div>
          <button type="submit">${t('save_profile')}</button>
          <button type="button" class="danger-ghost" id="account-logout">${t('header_logout')}</button>
        </form>
      `
          : `
        <div class="panel">
          <h2>${t('login_manage_profile')}</h2>
          <p><a href="/account/login" class="cart-view-btn">${t('go_to_login')}</a></p>
        </div>
      `
      }
    </section>
  `;

  if (loggedIn) {
    try {
      state.taxReference = await request('/api/tax/reference');
    } catch {
      state.taxReference = { countries: [] };
    }
    setupProfileCountryProvinceControls(profile);

    document.querySelector('#account-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const err = document.querySelector('#account-error');
      const ok = document.querySelector('#account-success');
      err.style.display = 'none';
      ok.style.display = 'none';
      const payload = Object.fromEntries(new FormData(event.currentTarget).entries());

      if (normalize(payload.country) === 'other') {
        payload.country = String(payload.countryManual || '').trim();
        payload.province = String(payload.provinceManual || '').trim();
      } else {
        payload.country = String(payload.country || '').trim();
        payload.province = String(payload.province || '').trim();
      }
      delete payload.countryManual;
      delete payload.provinceManual;

      if (!payload.country || !payload.province) {
        err.textContent = 'Please provide both country and province/state.';
        err.style.display = 'block';
        return;
      }

      try {
        const data = await request('/api/auth/customer/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        setCustomerSession(token, data.customer);
        ok.textContent = t('profile_saved');
        ok.style.display = 'block';
      } catch (error) {
        err.textContent = error.message || t('failed_save_profile');
        err.style.display = 'block';
      }
    });

    document.querySelector('#account-logout')?.addEventListener('click', () => {
      clearCustomerSession();
      location.href = '/';
    });
  }
}

init();
