const CANADA_REGIONS = [
  { code: 'AB', name: 'Alberta', mode: 'SPLIT', combinedRatePct: 5, components: [{ label: 'GST', ratePct: 5 }, { label: 'Provincial', ratePct: 0 }] },
  { code: 'BC', name: 'British Columbia', mode: 'SPLIT', combinedRatePct: 12, components: [{ label: 'GST', ratePct: 5 }, { label: 'PST', ratePct: 7 }] },
  { code: 'MB', name: 'Manitoba', mode: 'SPLIT', combinedRatePct: 12, components: [{ label: 'GST', ratePct: 5 }, { label: 'RST', ratePct: 7 }] },
  { code: 'NB', name: 'New Brunswick', mode: 'HST', combinedRatePct: 15, components: [{ label: 'HST', ratePct: 15 }] },
  { code: 'NL', name: 'Newfoundland and Labrador', mode: 'HST', combinedRatePct: 15, components: [{ label: 'HST', ratePct: 15 }] },
  { code: 'NT', name: 'Northwest Territories', mode: 'SPLIT', combinedRatePct: 5, components: [{ label: 'GST', ratePct: 5 }, { label: 'Provincial', ratePct: 0 }] },
  { code: 'NS', name: 'Nova Scotia', mode: 'HST', combinedRatePct: 14, components: [{ label: 'HST', ratePct: 14 }] },
  { code: 'NU', name: 'Nunavut', mode: 'SPLIT', combinedRatePct: 5, components: [{ label: 'GST', ratePct: 5 }, { label: 'Provincial', ratePct: 0 }] },
  { code: 'ON', name: 'Ontario', mode: 'HST', combinedRatePct: 13, components: [{ label: 'HST', ratePct: 13 }] },
  { code: 'PE', name: 'Prince Edward Island', mode: 'HST', combinedRatePct: 15, components: [{ label: 'HST', ratePct: 15 }] },
  { code: 'QC', name: 'Quebec', mode: 'SPLIT', combinedRatePct: 14.975, components: [{ label: 'GST', ratePct: 5 }, { label: 'QST', ratePct: 9.975 }] },
  { code: 'SK', name: 'Saskatchewan', mode: 'SPLIT', combinedRatePct: 11, components: [{ label: 'GST', ratePct: 5 }, { label: 'PST', ratePct: 6 }] },
  { code: 'YT', name: 'Yukon', mode: 'SPLIT', combinedRatePct: 5, components: [{ label: 'GST', ratePct: 5 }, { label: 'Provincial', ratePct: 0 }] }
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
  'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
].map((name) => ({
  code: name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  name
}));

const UK_REGIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'].map((name) => ({
  code: name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  name
}));

const FR_REGIONS = [
  'Auvergne-Rhone-Alpes',
  'Bourgogne-Franche-Comte',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Ile-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Cote d Azur'
].map((name) => ({
  code: name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  name
}));

const AU_REGIONS = ['Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'].map((name) => ({
  code: name.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
  name
}));

const TAX_REFERENCE = [
  {
    code: 'CA',
    name: 'Canada',
    popular: true,
    regionLabel: 'Province / Territory',
    taxPolicy: 'REGION_EXACT',
    regions: CANADA_REGIONS,
    sources: [
      {
        label: 'Canada Revenue Agency: GST/HST calculator and rates',
        url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html'
      },
      {
        label: 'Revenu Quebec: GST/HST and QST rules',
        url: 'https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/basic-rules-for-applying-the-gsthst-and-qst/'
      },
      {
        label: 'Government of British Columbia: PST',
        url: 'https://www2.gov.bc.ca/gov/content/taxes/sales-taxes/pst'
      },
      {
        label: 'Government of Saskatchewan: PST',
        url: 'https://www.saskatchewan.ca/business/taxes-licensing-and-reporting/provincial-taxes-policies-and-bulletins/provincial-sales-tax'
      },
      {
        label: 'Government of Manitoba: RST',
        url: 'https://www.gov.mb.ca/finance/taxation/tao/rst.html'
      }
    ]
  },
  {
    code: 'US',
    name: 'United States',
    popular: false,
    regionLabel: 'State',
    taxPolicy: 'MANUAL_REVIEW',
    regions: US_STATES,
    sources: [
      {
        label: 'USA.gov: State and local taxes overview',
        url: 'https://www.usa.gov/state-taxes'
      }
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    popular: false,
    regionLabel: 'Nation / Region',
    taxPolicy: 'COUNTRY_FIXED',
    fixedRatePct: 20,
    fixedLabel: 'VAT',
    regions: UK_REGIONS,
    sources: [
      {
        label: 'GOV.UK: VAT rates',
        url: 'https://www.gov.uk/vat-rates'
      }
    ]
  },
  {
    code: 'FR',
    name: 'France',
    popular: false,
    regionLabel: 'Region',
    taxPolicy: 'COUNTRY_FIXED',
    fixedRatePct: 20,
    fixedLabel: 'TVA',
    regions: FR_REGIONS,
    sources: [
      {
        label: 'economie.gouv.fr: TVA rates in France',
        url: 'https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mes-autres-impots-et-taxes/tva-quels-sont-les-taux-de-votre-quotidien'
      }
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    popular: false,
    regionLabel: 'State / Territory',
    taxPolicy: 'COUNTRY_FIXED',
    fixedRatePct: 10,
    fixedLabel: 'GST',
    regions: AU_REGIONS,
    sources: [
      {
        label: 'Australian Taxation Office: GST',
        url: 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst'
      }
    ]
  },
  {
    code: 'OTHER',
    name: 'Other',
    popular: false,
    regionLabel: 'Province / State / Region',
    taxPolicy: 'COUNTRY_FIXED',
    fixedRatePct: 10,
    fixedLabel: 'Estimated Tax',
    regions: [
      { code: 'NOT_LISTED', name: 'Not listed / Other' }
    ],
    sources: []
  }
];

function normalize(text = '') {
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

function cents(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function pctToCents(amountCents, pct) {
  return Math.round((cents(amountCents) * Number(pct || 0)) / 100);
}

function findCountry(countryInput = '') {
  const key = normalize(countryInput);
  if (!key) return TAX_REFERENCE[0];
  const matched = (
    TAX_REFERENCE.find((country) => normalize(country.name) === key) ||
    TAX_REFERENCE.find((country) => normalize(country.code) === key) ||
    null
  );
  if (matched) return matched;

  const other = TAX_REFERENCE.find((country) => country.code === 'OTHER') || TAX_REFERENCE[TAX_REFERENCE.length - 1];
  return {
    ...other,
    code: 'OTHER_CUSTOM',
    name: String(countryInput || '').trim() || 'Other',
    _isCustom: true
  };
}

function findRegion(country, regionInput = '') {
  if (country?._isCustom) {
    return {
      code: 'CUSTOM_REGION',
      name: String(regionInput || '').trim() || 'Other'
    };
  }

  if (country?.code === 'OTHER') {
    const customName = String(regionInput || '').trim();
    if (customName && normalize(customName) !== 'not listed / other') {
      return {
        code: 'OTHER_CUSTOM_REGION',
        name: customName
      };
    }
  }

  const regions = Array.isArray(country?.regions) ? country.regions : [];
  if (!regions.length) return null;
  const key = normalize(regionInput);
  if (!key) return regions[0];
  return (
    regions.find((region) => normalize(region.name) === key) ||
    regions.find((region) => normalize(region.code) === key) ||
    regions[0]
  );
}

export function resolveCountryRegion(countryInput = '', regionInput = '') {
  const country = findCountry(countryInput);
  const region = findRegion(country, regionInput);
  return {
    countryName: country?.name || '',
    regionName: region?.name || '',
    countryCode: country?.code || '',
    regionCode: region?.code || '',
    valid: Boolean(country && region)
  };
}

export function getTaxReferencePayload() {
  return {
    countries: TAX_REFERENCE.map((country) => ({
      code: country.code,
      name: country.name,
      popular: Boolean(country.popular),
      regionLabel: country.regionLabel || 'Region',
      taxPolicy: country.taxPolicy,
      fixedRatePct: country.fixedRatePct ?? null,
      fixedLabel: country.fixedLabel || null,
      regions: (country.regions || []).map((region) => ({
        code: region.code,
        name: region.name,
        mode: region.mode || null,
        combinedRatePct: region.combinedRatePct ?? null,
        components: region.components || null
      })),
      sources: country.sources || []
    }))
  };
}

export function calculateTaxQuote({ country, region, subtotalCents }) {
  const subtotal = cents(subtotalCents);
  const selectedCountry = findCountry(country);
  const selectedRegion = findRegion(selectedCountry, region);

  if (selectedCountry.taxPolicy === 'REGION_EXACT') {
    const components = (selectedRegion?.components || []).map((item) => ({
      label: item.label,
      ratePct: Number(item.ratePct || 0),
      amountCents: pctToCents(subtotal, item.ratePct)
    }));
    const taxCents = components.reduce((sum, item) => sum + Number(item.amountCents || 0), 0);
    const effectiveRatePct = Number(selectedRegion?.combinedRatePct || 0);
    return {
      country: selectedCountry.name,
      region: selectedRegion?.name || '',
      subtotalCents: subtotal,
      taxCents,
      totalCents: subtotal + taxCents,
      effectiveRatePct,
      components,
      policy: selectedCountry.taxPolicy,
      note: selectedRegion?.mode === 'HST' ? 'HST is a combined federal and provincial rate.' : 'Federal and provincial components are shown separately.',
      sources: selectedCountry.sources || []
    };
  }

  if (selectedCountry.taxPolicy === 'COUNTRY_FIXED') {
    const ratePct = Number(selectedCountry.fixedRatePct || 0);
    const taxCents = pctToCents(subtotal, ratePct);
    return {
      country: selectedCountry.name,
      region: selectedRegion?.name || '',
      subtotalCents: subtotal,
      taxCents,
      totalCents: subtotal + taxCents,
      effectiveRatePct: ratePct,
      components: [{ label: selectedCountry.fixedLabel || 'Tax', ratePct, amountCents: taxCents }],
      policy: selectedCountry.taxPolicy,
      note: 'Standard national rate applied for checkout estimation. Reduced/exempt categories may differ.',
      sources: selectedCountry.sources || []
    };
  }

  return {
    country: selectedCountry.name,
    region: selectedRegion?.name || '',
    subtotalCents: subtotal,
    taxCents: 0,
    totalCents: subtotal,
    effectiveRatePct: 0,
    components: [],
    policy: selectedCountry.taxPolicy,
    note: 'Tax varies by local rules. Please review manually before finalizing tax collection for this address.',
    sources: selectedCountry.sources || []
  };
}
