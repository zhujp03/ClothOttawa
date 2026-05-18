import crypto from 'node:crypto';

function normalizePhone(value = '') {
  return String(value).replace(/[^0-9+]/g, '').trim();
}

function normalizePostalCode(value = '') {
  return String(value).replace(/\s+/g, '').toUpperCase().trim();
}

function normalizeAddress(address = {}) {
  return [
    String(address.addressLine1 || '').trim().toLowerCase(),
    String(address.addressLine2 || '').trim().toLowerCase(),
    String(address.city || '').trim().toLowerCase(),
    String(address.province || '').trim().toLowerCase(),
    String(address.country || '').trim().toLowerCase()
  ].join('|');
}

function hashWithSecret(value) {
  const secret = process.env.PII_HASH_SECRET || process.env.JWT_SECRET || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
}

export function phoneHash(value) {
  return hashWithSecret(normalizePhone(value));
}

export function postalCodeHash(value) {
  return hashWithSecret(normalizePostalCode(value));
}

export function addressHash(address) {
  return hashWithSecret(normalizeAddress(address));
}

export function matchesNormalizedPhone(rawA, rawB) {
  return normalizePhone(rawA) === normalizePhone(rawB);
}

export function matchesNormalizedPostal(rawA, rawB) {
  return normalizePostalCode(rawA) === normalizePostalCode(rawB);
}
