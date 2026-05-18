import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const DEFAULT_HOST = 'imap.gmail.com';
const DEFAULT_PORT = 993;
const DEFAULT_MAILBOX = 'INBOX';
const DEFAULT_SCAN_LIMIT = 200;
const DEFAULT_KEYWORD = 'interac';

function truthy(value) {
  const raw = String(value || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function normalizeText(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function stripHtml(input) {
  return String(input || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function extractAmountCentsList(text) {
  const source = String(text || '');
  const hits = [];
  const patterns = [
    /(?:C\$|CA\$|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/gi,
    /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)\s*(?:CAD|C\$|CA\$)/gi
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match) {
      const normalized = String(match[1] || '')
        .replace(/,/g, '')
        .trim();
      const value = Number.parseFloat(normalized);
      if (Number.isFinite(value) && value > 0) {
        hits.push(Math.round(value * 100));
      }
      match = pattern.exec(source);
    }
  }

  return [...new Set(hits)];
}

function buildImapClient() {
  return new ImapFlow({
    host: process.env.GMAIL_IMAP_HOST || DEFAULT_HOST,
    port: Number(process.env.GMAIL_IMAP_PORT || DEFAULT_PORT),
    secure: true,
    connectionTimeout: 20_000,
    greetingTimeout: 12_000,
    socketTimeout: 20_000,
    disableAutoIdle: true,
    disableCompression: true,
    auth: {
      user: String(process.env.GMAIL_IMAP_USER || '').trim(),
      pass: String(process.env.GMAIL_IMAP_PASSWORD || '').trim()
    },
    logger: false
  });
}

function buildMessageText(parsed) {
  const subject = normalizeText(parsed?.subject || '');
  const text = normalizeText(parsed?.text || '');
  const htmlText = normalizeText(stripHtml(parsed?.html || parsed?.textAsHtml || ''));
  return `${subject}\n${text}\n${htmlText}`.trim();
}

function shouldAcceptMessage({ text, keyword }) {
  if (!keyword) return true;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function parseFilterFromList(raw) {
  return String(raw || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function extractFromAddresses(parsed) {
  const fromValue = parsed?.from?.value;
  if (!Array.isArray(fromValue)) return [];
  return fromValue
    .map((item) => String(item?.address || '').trim().toLowerCase())
    .filter(Boolean);
}

function matchesFromFilter({ parsed, allowedFrom = [] }) {
  if (!allowedFrom.length) return true;
  const addresses = extractFromAddresses(parsed);
  if (!addresses.length) return false;
  return addresses.some((addr) =>
    allowedFrom.some((rule) => {
      const normalizedRule = String(rule || '').trim().toLowerCase();
      if (!normalizedRule) return false;
      if (normalizedRule.startsWith('@')) {
        return addr.endsWith(normalizedRule);
      }
      return addr === normalizedRule;
    })
  );
}

export function isEtransferMonitorConfigured() {
  if (!truthy(process.env.ETRANSFER_MONITOR_ENABLED)) return false;
  return Boolean(String(process.env.GMAIL_IMAP_USER || '').trim() && String(process.env.GMAIL_IMAP_PASSWORD || '').trim());
}

export async function findEtransferMatch({
  totalCents,
  createdAt
}) {
  if (!isEtransferMonitorConfigured()) {
    return { matched: false, reason: 'ETRANSFER_MONITOR_NOT_CONFIGURED' };
  }

  const mailbox = String(process.env.GMAIL_IMAP_MAILBOX || DEFAULT_MAILBOX).trim() || DEFAULT_MAILBOX;
  const allowedFrom = parseFilterFromList(process.env.GMAIL_ETRANSFER_FROM || '');
  const filterKeyword = String(process.env.GMAIL_ETRANSFER_KEYWORD || DEFAULT_KEYWORD).trim();
  const configuredScanLimit = Number(process.env.GMAIL_ETRANSFER_SCAN_LIMIT || DEFAULT_SCAN_LIMIT);
  const scanLimit = Math.min(500, Math.max(30, Number.isFinite(configuredScanLimit) ? configuredScanLimit : DEFAULT_SCAN_LIMIT));
  const createdAtMs = Number(new Date(createdAt).getTime());
  const safeCreatedAtMs = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
  const earliestMatchMs = safeCreatedAtMs - 30 * 60 * 1000;
  const since = new Date(Math.max(0, safeCreatedAtMs - 24 * 60 * 60 * 1000));

  const client = buildImapClient();
  let emittedError = null;
  const onImapError = (error) => {
    emittedError = error;
    console.warn('[etransfer-imap] client error', error?.code || '', error?.message || error);
  };
  client.on('error', onImapError);

  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);
    try {
      const query = { since };

      const uids = await client.search(query);
      if (!uids?.length) return { matched: false, reason: 'NO_RECENT_MESSAGES' };

      const recentUids = uids.slice(-scanLimit).reverse();
      for (const uid of recentUids) {
        try {
        const message = await client.fetchOne(uid, {
          uid: true,
          internalDate: true,
          envelope: true,
          source: true
        });

          if (!message?.source) continue;
          const parsed = await simpleParser(message.source);
          const messageDate = parsed?.date || message.internalDate || null;
          if (messageDate) {
            const messageDateMs = Number(new Date(messageDate).getTime());
            if (Number.isFinite(messageDateMs) && messageDateMs < earliestMatchMs) continue;
          }

          if (!matchesFromFilter({ parsed, allowedFrom })) continue;

          const text = buildMessageText(parsed);
          if (!shouldAcceptMessage({ text, keyword: filterKeyword })) continue;

          const rawSourceText = Buffer.isBuffer(message.source)
            ? message.source.toString('utf8')
            : String(message.source || '');
          const amounts = [...new Set([...extractAmountCentsList(text), ...extractAmountCentsList(rawSourceText)])];
          if (!amounts.includes(Number(totalCents))) continue;

          return {
            matched: true,
            matchRef: `imap-uid:${uid}`,
            matchedAt: new Date(),
            messageDate: messageDate ? new Date(messageDate) : null,
            subject: normalizeText(parsed?.subject || '')
          };
        } catch (error) {
          console.warn('[etransfer-imap] message scan failed', error?.code || '', error?.message || error);
        }
      }
    } finally {
      lock.release();
    }
  } catch (error) {
    console.warn('[etransfer-imap] query failed', error?.code || '', error?.message || error);
    return {
      matched: false,
      reason: error?.code ? `IMAP_${String(error.code).toUpperCase()}` : 'IMAP_QUERY_FAILED'
    };
  } finally {
    client.removeListener('error', onImapError);
    await client.logout().catch(() => {});
  }

  if (emittedError) {
    return {
      matched: false,
      reason: emittedError?.code ? `IMAP_${String(emittedError.code).toUpperCase()}` : 'IMAP_CLIENT_ERROR'
    };
  }

  return { matched: false, reason: 'MATCH_NOT_FOUND' };
}
