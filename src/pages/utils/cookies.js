/**
 * cookies.js — Tiny cookie + consent helpers
 *
 * Cookie consent object stored in localStorage under 'cookie_consent':
 *   { necessary: true, analytics: bool, preferences: bool, savedLogin: bool, decided: bool }
 *
 * Actual browser cookies (document.cookie) are used for savedLogin username.
 */

// ── Raw cookie helpers ──────────────────────────────────────────────────
export function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

// ── Consent storage ─────────────────────────────────────────────────────
const CONSENT_KEY = 'cookie_consent';

const DEFAULT_CONSENT = {
  necessary:   true,   // always on
  analytics:   false,
  preferences: false,
  savedLogin:  false,
  decided:     false,  // false = banner not yet shown / decision not yet made
};

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return { ...DEFAULT_CONSENT };
    return { ...DEFAULT_CONSENT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONSENT };
  }
}

export function saveConsent(consent) {
  const full = { ...DEFAULT_CONSENT, ...consent, necessary: true, decided: true };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
  // Apply side-effects based on consent
  if (!full.savedLogin) {
    deleteCookie('saved_username');
  }
  return full;
}

export function hasDecided() {
  return getConsent().decided === true;
}

// ── Saved-login helpers ─────────────────────────────────────────────────
export function saveSavedUsername(username) {
  const consent = getConsent();
  if (!consent.savedLogin) return;
  setCookie('saved_username', username, 90); // 90 days
}

export function getSavedUsername() {
  return getCookie('saved_username') || '';
}

export function clearSavedUsername() {
  deleteCookie('saved_username');
}

// ── Session helpers ─────────────────────────────────────────────────────
/**
 * Decode JWT expiry and return the Date it expires.
 * Returns null if the token is missing or malformed.
 */
export function getTokenExpiry(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

/**
 * Milliseconds remaining until the JWT expires.
 * Returns 0 if already expired, null if token is missing.
 */
export function msUntilExpiry(token) {
  const exp = getTokenExpiry(token);
  if (!exp) return null;
  return Math.max(0, exp.getTime() - Date.now());
}
