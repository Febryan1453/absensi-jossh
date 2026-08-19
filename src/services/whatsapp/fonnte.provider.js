/**
 * Fonnte WhatsApp gateway provider.
 *
 * Pure transport layer: it knows how to talk HTTP to Fonnte and nothing else.
 * No database access, no Express, no environment variables. Every credential is
 * passed in by the caller so this module can be unit tested by stubbing fetch.
 *
 * Two rules drive the design:
 *  1. Never throw. Every failure (bad input, network, timeout, gateway error)
 *     comes back as a uniform `{ ok: false, message }` object so the calling
 *     service can record it in attendance_notifications without try/catch.
 *  2. Never leak the API token. It is only ever placed in the Authorization
 *     header, and every outgoing message is scrubbed before being returned.
 *
 * Fonnte quirk that shaped the parser: failures are returned with HTTP 200 and
 * a JSON body of {"status":false,"reason":"token invalid"}. The HTTP status
 * code alone is NOT a success signal, the `status` field has to be checked.
 */

const DEFAULT_BASE_URL = 'https://api.fonnte.com';
const DEFAULT_TIMEOUT_MS = 10000;
const REDACTION = '[redacted]';
const MAX_SNIPPET_LENGTH = 160;

/**
 * Remove the API token from any string before it leaves this module.
 * Guards against a token accidentally reaching a log file or an API response.
 * @param {string} text
 * @param {string} [token]
 * @returns {string}
 */
const redact = (text, token) => {
  const value = typeof text === 'string' ? text : String(text ?? '');
  if (typeof token !== 'string' || token.trim().length < 4) return value;
  return value.split(token.trim()).join(REDACTION);
};

/**
 * Shorten a raw gateway body so an HTML error page does not flood the logs.
 * @param {string} text
 * @returns {string}
 */
const snippet = (text) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > MAX_SNIPPET_LENGTH ? `${flat.slice(0, MAX_SNIPPET_LENGTH)}...` : flat;
};

/**
 * Build an endpoint URL from a configurable base URL.
 * @param {string} baseUrl
 * @param {string} path - e.g. '/device'
 * @returns {{ ok: boolean, url?: string, message?: string }}
 */
const buildUrl = (baseUrl, path) => {
  const base = String(baseUrl || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');

  // A query string or fragment in the base would swallow the endpoint path:
  // "https://api.fonnte.com/send?x=" + "/device" resolves to the /send
  // endpoint. The admin controls this value from the settings screen, so the
  // read-only promise of checkDevice has to be enforced, not assumed.
  if (base.includes('?') || base.includes('#')) {
    return { ok: false, message: 'Gateway base URL must not contain a query string or fragment' };
  }

  let parsed;
  try {
    parsed = new URL(base + path);
  } catch (err) {
    return { ok: false, message: `Invalid gateway base URL: "${snippet(base)}"` };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, message: `Gateway base URL must use http or https, got "${parsed.protocol}"` };
  }

  return { ok: true, url: parsed.toString() };
};

/**
 * Normalize an Indonesian phone number to the format Fonnte expects (62xxx).
 *
 * Accepts 08xx, 8xx, +62xx, 62xx, 0062xx and any of those written with spaces,
 * dots, dashes or parentheses.
 *
 * A number carrying an explicit international prefix other than +62 is
 * REJECTED rather than reinterpreted. Reinterpreting is genuinely dangerous:
 * "+81 90 1234 5678" (Japan) would otherwise be read as an Indonesian 8xx
 * number and rewritten to 62819012345678, delivering a private attendance
 * message to an unrelated stranger with no way to take it back. The public
 * contract also fixes the stored format at /^62\d{8,13}$/, so a foreign
 * number could not be persisted anyway.
 *
 * @param {string|number} raw
 * @returns {{ ok: boolean, phone?: string, message?: string }}
 */
const normalizePhone = (raw) => {
  if (raw === null || raw === undefined) {
    return { ok: false, message: 'Phone number is required' };
  }

  const input = String(raw).trim();
  if (!input) {
    return { ok: false, message: 'Phone number is required' };
  }

  // Only digits and the usual separators are acceptable; letters mean it is not a number.
  if (/[^0-9+\-\s().]/.test(input)) {
    return { ok: false, message: `Phone number contains invalid characters: "${snippet(input)}"` };
  }

  let isInternational = input.startsWith('+');
  let digits = input.replace(/\D/g, '');

  // International access code, e.g. 006285xxx
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    isInternational = true;
  }

  if (!digits) {
    return { ok: false, message: `Phone number has no digits: "${snippet(input)}"` };
  }

  // An explicit international prefix that is not +62 is a foreign number.
  // Reject it here, before any Indonesian heuristic can rewrite it into a
  // valid looking 62xx number that belongs to somebody else entirely.
  if (isInternational && !digits.startsWith('62')) {
    return {
      ok: false,
      message: `Only Indonesian (+62) numbers are supported, got: "${snippet(input)}"`
    };
  }

  let phone;
  if (digits.startsWith('62')) {
    // Also handles the common "+62 0812..." mistake by dropping the trunk zero.
    phone = `62${digits.slice(2).replace(/^0+/, '')}`;
  } else if (digits.startsWith('0')) {
    phone = `62${digits.replace(/^0+/, '')}`;
  } else if (digits.startsWith('8')) {
    phone = `62${digits}`;
  } else {
    return { ok: false, message: `Phone number is not a recognizable Indonesian number: "${snippet(input)}"` };
  }

  // Indonesian mobile numbers are 62 + 8 + 8..11 digits (11..14 digits in total).
  if (!/^628\d{8,11}$/.test(phone)) {
    return { ok: false, message: `Phone number is not a valid Indonesian mobile number: "${snippet(input)}"` };
  }

  return { ok: true, phone };
};

/**
 * Coerce Fonnte's loosely typed numeric fields (quota arrives as the string "1000").
 * @param {*} value
 * @returns {number|string|null}
 */
const toNumberOrRaw = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : String(value);
};

/**
 * Fonnte reports success through a body field, not the HTTP status code.
 * @param {object} data
 * @returns {boolean}
 */
const isPayloadOk = (data) => Boolean(data) && (data.status === true || data.status === 'true');

/**
 * Pull the human readable reason out of a Fonnte payload.
 * @param {object} data
 * @param {string} fallback
 * @returns {string}
 */
const payloadReason = (data, fallback) => {
  if (!data) return fallback;
  const reason = data.reason || data.detail || data.message;
  return reason ? String(reason) : fallback;
};

/**
 * POST an application/x-www-form-urlencoded request to Fonnte with a hard timeout.
 *
 * A hanging gateway must never hold up an attendance check-in at the school
 * gate, so the request is aborted by an AbortController after `timeoutMs`.
 *
 * @param {object} params
 * @param {string} params.token
 * @param {string} params.url
 * @param {object} [params.form]
 * @param {number} [params.timeoutMs]
 * @returns {Promise<{ ok: boolean, data?: object, latencyMs: number, message?: string }>}
 */
const postForm = async ({ token, url, form = {}, timeoutMs = DEFAULT_TIMEOUT_MS }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(form).toString(),
      signal: controller.signal
    });

    const latencyMs = Date.now() - startedAt;
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return {
        ok: false,
        latencyMs,
        message: `Gateway returned a non-JSON response (HTTP ${response.status}): ${redact(snippet(text), token)}`
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        latencyMs,
        data,
        message: redact(payloadReason(data, `Gateway responded with HTTP ${response.status}`), token)
      };
    }

    return { ok: true, data, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;

    if (err && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      return { ok: false, latencyMs, message: `Gateway did not respond within ${timeoutMs} ms` };
    }

    const code = (err && ((err.cause && err.cause.code) || err.code)) || 'NETWORK_ERROR';
    return { ok: false, latencyMs, message: redact(`Cannot reach WhatsApp gateway (${code})`, token) };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Check the WhatsApp device status. Read only: this endpoint never sends a
 * message, so it is safe to call for connection tests and health checks.
 *
 * @param {string} token - Fonnte API token (never logged, never returned)
 * @param {string} [baseUrl=https://api.fonnte.com]
 * @param {object} [options]
 * @param {number} [options.timeoutMs=10000]
 * @returns {Promise<{ ok: boolean, device: string|null, status: string|null,
 *   quota: number|string|null, expired: string|null, name: string|null,
 *   package: string|null, latencyMs: number, message: string }>}
 */
const checkDevice = async (token, baseUrl = DEFAULT_BASE_URL, options = {}) => {
  const empty = { device: null, status: null, quota: null, expired: null, name: null, package: null };

  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, ...empty, latencyMs: 0, message: 'API token is not configured' };
  }

  const target = buildUrl(baseUrl, '/device');
  if (!target.ok) {
    return { ok: false, ...empty, latencyMs: 0, message: target.message };
  }

  const result = await postForm({
    token: token.trim(),
    url: target.url,
    timeoutMs: options.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : options.timeoutMs
  });

  if (!result.ok) {
    return { ok: false, ...empty, latencyMs: result.latencyMs, message: result.message };
  }

  const data = result.data || {};

  if (!isPayloadOk(data)) {
    return {
      ok: false,
      ...empty,
      latencyMs: result.latencyMs,
      message: redact(payloadReason(data, 'Gateway rejected the request'), token)
    };
  }

  const status = data.device_status ? String(data.device_status) : null;

  return {
    ok: true,
    device: data.device ? String(data.device) : null,
    status,
    quota: toNumberOrRaw(data.quota),
    expired: data.expired ? String(data.expired) : null,
    name: data.name ? String(data.name) : null,
    package: data.package ? String(data.package) : null,
    latencyMs: result.latencyMs,
    message: status === 'connect' ? 'Device connected' : `Device status: ${status || 'unknown'}`
  };
};

/**
 * Send a WhatsApp message through Fonnte.
 *
 * WARNING: this reaches a real phone. The caller is responsible for honouring
 * simulation mode and quiet hours before calling it.
 *
 * @param {object} params
 * @param {string} params.token
 * @param {string} [params.baseUrl=https://api.fonnte.com]
 * @param {string} params.target - phone number in any Indonesian format
 * @param {string} params.message
 * @param {number} [params.timeoutMs=10000]
 * @returns {Promise<{ ok: boolean, messageId: string|null, target: string|null,
 *   process: string|null, latencyMs: number, message: string }>}
 */
const sendMessage = async ({ token, baseUrl = DEFAULT_BASE_URL, target, message, timeoutMs } = {}) => {
  const empty = { messageId: null, target: null, process: null };

  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, ...empty, latencyMs: 0, message: 'API token is not configured' };
  }

  const phone = normalizePhone(target);
  if (!phone.ok) {
    return { ok: false, ...empty, latencyMs: 0, message: phone.message };
  }

  const body = typeof message === 'string' ? message.trim() : '';
  if (!body) {
    return { ok: false, ...empty, target: phone.phone, latencyMs: 0, message: 'Message body is empty' };
  }

  const url = buildUrl(baseUrl, '/send');
  if (!url.ok) {
    return { ok: false, ...empty, target: phone.phone, latencyMs: 0, message: url.message };
  }

  const result = await postForm({
    token: token.trim(),
    url: url.url,
    form: { target: phone.phone, message: body },
    timeoutMs: timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : timeoutMs
  });

  if (!result.ok) {
    return { ok: false, ...empty, target: phone.phone, latencyMs: result.latencyMs, message: result.message };
  }

  const data = result.data || {};

  if (!isPayloadOk(data)) {
    return {
      ok: false,
      ...empty,
      target: phone.phone,
      latencyMs: result.latencyMs,
      message: redact(payloadReason(data, 'Gateway refused to send the message'), token)
    };
  }

  const id = Array.isArray(data.id) ? data.id[0] : data.id;

  return {
    ok: true,
    messageId: id === null || id === undefined ? null : String(id),
    target: phone.phone,
    process: data.process ? String(data.process) : null,
    latencyMs: result.latencyMs,
    message: redact(payloadReason(data, 'Message accepted by gateway'), token)
  };
};

module.exports = {
  checkDevice,
  sendMessage,
  normalizePhone,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS
};
