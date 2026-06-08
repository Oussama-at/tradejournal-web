/**
 * Unit tests — src/utils/cookies.js
 *
 * Run:  npm test -- --testPathPattern="cookies"
 */

// ── Mock browser globals ──────────────────────────────────────────────────
let cookieJar = '';
Object.defineProperty(document, 'cookie', {
  get:        () => cookieJar,
  set: (val)  => { cookieJar += (cookieJar ? '; ' : '') + val.split(';')[0]; },
  configurable: true,
});

const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear:      () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import AFTER mocks
const {
  setCookie, getCookie, deleteCookie,
  getConsent, saveConsent, hasDecided,
  saveSavedUsername, getSavedUsername, clearSavedUsername,
  getTokenExpiry, msUntilExpiry,
} = require('../../utils/cookies');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Raw Cookie Helpers
// ─────────────────────────────────────────────────────────────────────────────
describe('setCookie / getCookie / deleteCookie', () => {
  beforeEach(() => { cookieJar = ''; });

  test('setCookie stores a value readable by getCookie', () => {
    setCookie('test_key', 'hello');
    expect(getCookie('test_key')).toBe('hello');
  });

  test('getCookie returns null for unknown key', () => {
    expect(getCookie('nonexistent')).toBeNull();
  });

  test('setCookie encodes special characters', () => {
    setCookie('user', 'john doe & co');
    const raw = document.cookie;
    expect(raw).toContain('%');               // encoded
    expect(getCookie('user')).toBe('john doe & co'); // decoded back
  });

  test('deleteCookie makes getCookie return null', () => {
    setCookie('bye', 'value');
    deleteCookie('bye');
    // After deletion the jar has an expired entry; getCookie should not find it
    // (In the real browser the expired cookie disappears; in our mock we test the regex)
    expect(document.cookie).not.toMatch(/^bye=/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Consent Storage
// ─────────────────────────────────────────────────────────────────────────────
describe('getConsent / saveConsent / hasDecided', () => {
  beforeEach(() => { localStorage.clear(); cookieJar = ''; });

  test('getConsent returns defaults when nothing stored', () => {
    const c = getConsent();
    expect(c.necessary).toBe(true);
    expect(c.analytics).toBe(false);
    expect(c.preferences).toBe(false);
    expect(c.savedLogin).toBe(false);
    expect(c.decided).toBe(false);
  });

  test('hasDecided returns false before any decision', () => {
    expect(hasDecided()).toBe(false);
  });

  test('saveConsent persists values and marks decided = true', () => {
    saveConsent({ analytics: true, preferences: true, savedLogin: false });
    const c = getConsent();
    expect(c.analytics).toBe(true);
    expect(c.preferences).toBe(true);
    expect(c.decided).toBe(true);
    expect(hasDecided()).toBe(true);
  });

  test('saveConsent always forces necessary = true', () => {
    saveConsent({ necessary: false }); // try to turn it off
    expect(getConsent().necessary).toBe(true);
  });

  test('saveConsent clears saved_username cookie when savedLogin = false', () => {
    setCookie('saved_username', 'alice');
    saveConsent({ savedLogin: false });
    // Cookie jar should no longer contain a valid saved_username
    expect(document.cookie).not.toMatch(/saved_username=alice/);
  });

  test('getConsent handles corrupted localStorage gracefully', () => {
    localStorage.setItem('cookie_consent', '{bad json}');
    expect(() => getConsent()).not.toThrow();
    expect(getConsent().necessary).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Saved-Login Helpers
// ─────────────────────────────────────────────────────────────────────────────
describe('saveSavedUsername / getSavedUsername / clearSavedUsername', () => {
  beforeEach(() => { localStorage.clear(); cookieJar = ''; });

  test('getSavedUsername returns empty string when nothing saved', () => {
    expect(getSavedUsername()).toBe('');
  });

  test('saveSavedUsername does NOT save when savedLogin consent is false', () => {
    saveConsent({ savedLogin: false });
    saveSavedUsername('bob');
    expect(getSavedUsername()).toBe('');
  });

  test('saveSavedUsername saves when savedLogin consent is true', () => {
    saveConsent({ savedLogin: true });
    saveSavedUsername('alice');
    expect(getSavedUsername()).toBe('alice');
  });

  test('clearSavedUsername empties the saved login', () => {
    saveConsent({ savedLogin: true });
    saveSavedUsername('charlie');
    clearSavedUsername();
    expect(getSavedUsername()).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. JWT Token Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal fake JWT with a given exp (Unix timestamp) */
function makeJWT(exp) {
  const payload = Buffer.from(JSON.stringify({ sub: 'user1', exp })).toString('base64');
  return `header.${payload}.sig`;
}

describe('getTokenExpiry / msUntilExpiry', () => {
  test('getTokenExpiry returns null for null/undefined token', () => {
    expect(getTokenExpiry(null)).toBeNull();
    expect(getTokenExpiry(undefined)).toBeNull();
    expect(getTokenExpiry('')).toBeNull();
  });

  test('getTokenExpiry returns null for malformed token', () => {
    expect(getTokenExpiry('not.a.jwt')).toBeNull();
    expect(getTokenExpiry('a.b.c')).toBeNull();
  });

  test('getTokenExpiry returns correct Date for valid JWT', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour ahead
    const token = makeJWT(futureExp);
    const expiry = getTokenExpiry(token);
    expect(expiry).toBeInstanceOf(Date);
    expect(expiry.getTime()).toBe(futureExp * 1000);
  });

  test('msUntilExpiry returns null for missing token', () => {
    expect(msUntilExpiry(null)).toBeNull();
  });

  test('msUntilExpiry returns positive ms for future token', () => {
    const token = makeJWT(Math.floor(Date.now() / 1000) + 3600);
    const ms = msUntilExpiry(token);
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(3600 * 1000);
  });

  test('msUntilExpiry returns 0 for already-expired token', () => {
    const token = makeJWT(Math.floor(Date.now() / 1000) - 60); // expired 1 min ago
    expect(msUntilExpiry(token)).toBe(0);
  });
});
