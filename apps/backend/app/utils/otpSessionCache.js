/**
 * Stores 2factor AUTOGEN session ids between "send OTP" and "verify OTP" on the same API instance.
 * Official flow: SEND → Details = session_id → VERIFY /SMS/VERIFY/{session_id}/{otp}
 * TTL matches typical OTP validity (~10 min).
 */

const OTP_SESSION_TTL_MS = 10 * 60 * 1000;

/** @type {Map<string, { sessionId: string; exp: number }>} */
const store = new Map();

function prune() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.exp < now) store.delete(k);
  }
}

/**
 * @param {string} cacheKey — use the same key as verify (e.g. normalized E.164 digits)
 */
export function rememberOtpSession(cacheKey, sessionId) {
  if (!cacheKey || !sessionId) return;
  prune();
  store.set(String(cacheKey), {
    sessionId: String(sessionId),
    exp: Date.now() + OTP_SESSION_TTL_MS,
  });
}

export function getOtpSession(cacheKey) {
  prune();
  const row = store.get(String(cacheKey));
  if (!row || row.exp < Date.now()) {
    store.delete(String(cacheKey));
    return null;
  }
  return row.sessionId;
}

export function clearOtpSession(cacheKey) {
  store.delete(String(cacheKey));
}
