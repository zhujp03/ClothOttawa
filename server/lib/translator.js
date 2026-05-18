function hasGoogleTranslateConfig() {
  return Boolean(process.env.GOOGLE_TRANSLATE_API_KEY);
}

function hasLibreTranslateConfig() {
  return Boolean(process.env.LIBRETRANSLATE_URL);
}

function truthy(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function hasMyMemoryConfig() {
  return truthy(process.env.MYMEMORY_TRANSLATE_ENABLED || 'true');
}

export function isMachineTranslationEnabled() {
  return hasGoogleTranslateConfig() || hasLibreTranslateConfig() || hasMyMemoryConfig();
}

const cache = new Map();
const CACHE_MAX = 200;

function getFromCache(key) {
  if (!cache.has(key)) return null;
  const value = cache.get(key);
  cache.delete(key);
  cache.set(key, value);
  return value;
}

function setCache(key, value) {
  if (!value) return;
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

async function translateWithGoogle(text, { target = 'fr', source = 'en' } = {}) {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) return null;

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: 'text'
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  const value = data?.data?.translations?.[0]?.translatedText;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function translateWithLibre(text, { target = 'fr', source = 'en' } = {}) {
  const url = process.env.LIBRETRANSLATE_URL;
  if (!url) return null;

  const payload = {
    q: text,
    source,
    target,
    format: 'text'
  };

  if (process.env.LIBRETRANSLATE_API_KEY) {
    payload.api_key = process.env.LIBRETRANSLATE_API_KEY;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  const value = data?.translatedText;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

async function translateWithMyMemory(text, { target = 'fr', source = 'en' } = {}) {
  if (!hasMyMemoryConfig()) return null;

  const params = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`
  });
  const email = String(process.env.MYMEMORY_CONTACT_EMAIL || '').trim();
  if (email) params.set('de', email);

  const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`, {
    method: 'GET'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return null;

  const value = data?.responseData?.translatedText;
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^quota exceeded$/i.test(value.trim())) return null;
  return value.trim();
}

export async function translateText(text, { target = 'fr', source = 'en' } = {}) {
  const input = String(text || '').trim();
  if (!input) return null;
  if (target === source) return input;
  const cacheKey = `${source}:${target}:${input}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    if (hasGoogleTranslateConfig()) {
      const result = await translateWithGoogle(input, { target, source });
      if (result) {
        setCache(cacheKey, result);
        return result;
      }
    }
    if (hasLibreTranslateConfig()) {
      const result = await translateWithLibre(input, { target, source });
      if (result) {
        setCache(cacheKey, result);
        return result;
      }
    }
    if (hasMyMemoryConfig()) {
      const result = await translateWithMyMemory(input, { target, source });
      if (result) {
        setCache(cacheKey, result);
        return result;
      }
    }
  } catch {
    return null;
  }

  return null;
}
