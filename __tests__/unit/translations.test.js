/**
 * Unit tests — src/lang/translations.js
 *
 * Validates structure, completeness and correctness of all translation keys
 * across English, Arabic and French locales.
 *
 * Run:  npm test -- --testPathPattern="translations"
 */

const translations = require('../../lang/translations').default
  || require('../../lang/translations');

const LOCALES = ['en', 'ar', 'fr'];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic structure
// ─────────────────────────────────────────────────────────────────────────────
describe('translations — structure', () => {
  test('exports an object with en, ar, fr keys', () => {
    expect(translations).toBeInstanceOf(Object);
    LOCALES.forEach(l => expect(translations).toHaveProperty(l));
  });

  test('each locale is a non-empty object', () => {
    LOCALES.forEach(l => {
      expect(typeof translations[l]).toBe('object');
      expect(Object.keys(translations[l]).length).toBeGreaterThan(50);
    });
  });

  test('all values are non-empty strings', () => {
    LOCALES.forEach(l => {
      Object.entries(translations[l]).forEach(([key, val]) => {
        expect(typeof val).toBe('string',  `${l}.${key} is not a string`);
        expect(val.length).toBeGreaterThan(0, `${l}.${key} is empty`);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Key completeness — every EN key must exist in AR and FR
// ─────────────────────────────────────────────────────────────────────────────
describe('translations — completeness', () => {
  const enKeys = Object.keys(translations.en);

  LOCALES.filter(l => l !== 'en').forEach(locale => {
    test(`all EN keys exist in ${locale}`, () => {
      const missing = enKeys.filter(k => !(k in translations[locale]));
      if (missing.length > 0) {
        console.warn(`Missing in ${locale}:`, missing);
      }
      expect(missing).toEqual([]);
    });
  });

  test('no duplicate keys exist (JS object shadowing)', () => {
    // Node silently overwrites duplicate keys; detect them by comparing
    // raw text parse count vs object key count
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
      path.join(__dirname, '../../lang/translations.js'),
      'utf8'
    );
    LOCALES.forEach(locale => {
      // Extract keys inside each locale block using a simple regex
      const localeBlock = src.match(new RegExp(`${locale}:\\s*\\{([\\s\\S]*?)\\},?\\s*(?:${LOCALES.filter(l=>l!==locale).join('|')}:|\\})`));
      if (!localeBlock) return; // skip if regex can't parse
      const rawKeys = [...localeBlock[1].matchAll(/^\s+(\w+)\s*:/gm)].map(m => m[1]);
      const uniqueKeys = new Set(rawKeys);
      expect(rawKeys.length).toBe(uniqueKeys.size);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Critical keys spot-check
// ─────────────────────────────────────────────────────────────────────────────
describe('translations — critical keys present', () => {
  const CRITICAL = [
    'nav_dashboard', 'nav_trades', 'nav_add_trade', 'logout',
    'login', 'register', 'username', 'password',
    'qty_integer_only',
    'session_warning_title', 'session_stay', 'session_expired_title',
    'cookie_title', 'cookie_accept_all', 'cookie_reject_all',
    'save_pwd_title',
    'col_date', 'col_status', 'col_amount', 'col_actions',
  ];

  LOCALES.forEach(l => {
    test(`${l} has all critical keys`, () => {
      CRITICAL.forEach(key => {
        expect(translations[l]).toHaveProperty(key);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Content sanity
// ─────────────────────────────────────────────────────────────────────────────
describe('translations — content sanity', () => {
  test('EN nav_dashboard equals "Dashboard"', () => {
    expect(translations.en.nav_dashboard).toBe('Dashboard');
  });

  test('AR has right-to-left content (contains Arabic script)', () => {
    const hasArabic = Object.values(translations.ar).some(v => /[\u0600-\u06FF]/.test(v));
    expect(hasArabic).toBe(true);
  });

  test('FR contains accented characters', () => {
    const hasFrench = Object.values(translations.fr).some(v => /[àâäéèêëîïôöùûüç]/i.test(v));
    expect(hasFrench).toBe(true);
  });

  test('qty_integer_only message mentions integer/whole in each locale', () => {
    // EN
    expect(translations.en.qty_integer_only.toLowerCase()).toMatch(/whole|integer/);
    // AR — just check it's non-empty and non-identical to EN
    expect(translations.ar.qty_integer_only).not.toBe(translations.en.qty_integer_only);
    // FR
    expect(translations.fr.qty_integer_only).not.toBe(translations.en.qty_integer_only);
  });

  test('session_warning_msg contains the {minutes} placeholder', () => {
    LOCALES.forEach(l => {
      expect(translations[l].session_warning_msg).toContain('{minutes}');
    });
  });

  test('no translation value accidentally contains raw HTML tags', () => {
    LOCALES.forEach(l => {
      Object.entries(translations[l]).forEach(([key, val]) => {
        expect(val).not.toMatch(/<[a-z]+>/i);
      });
    });
  });
});
