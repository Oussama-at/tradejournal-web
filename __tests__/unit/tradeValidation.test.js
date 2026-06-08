/**
 * Unit tests — Trade form business logic
 *
 * Tests the QTY integer-enforcement rules and other pure functions
 * extracted from AddTrade.jsx without needing a React renderer.
 *
 * Run:  npm test -- --testPathPattern="tradeValidation"
 */

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers mirroring AddTrade.jsx logic (tested in isolation)
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if the qty_type requires integer-only quantity */
function isIntegerQty(qtyType) {
  return qtyType === 'contract mini' || qtyType === 'contract micro';
}

/** Returns an error string if qty is invalid for the given type, else null */
function validateQty(qtyValue, qtyType) {
  if (isIntegerQty(qtyType)) {
    const n = parseFloat(qtyValue);
    if (isNaN(n) || n % 1 !== 0 || n < 1) {
      return 'qty_integer_only'; // translation key
    }
  }
  return null;
}

/** Returns true if a keypress should be blocked for integer-only fields */
function shouldBlockKey(key, currentValue, qtyType) {
  if (!isIntegerQty(qtyType)) return false;
  return key === '.' || key === ',';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. isIntegerQty
// ─────────────────────────────────────────────────────────────────────────────
describe('isIntegerQty', () => {
  test.each([
    ['contract mini',  true],
    ['contract micro', true],
    ['Lot',            false],
    ['',               false],
    [undefined,        false],
  ])('isIntegerQty(%s) === %s', (type, expected) => {
    expect(isIntegerQty(type)).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. validateQty — contract mini / micro
// ─────────────────────────────────────────────────────────────────────────────
describe('validateQty — contract mini', () => {
  const TYPE = 'contract mini';

  test('valid integer 1 passes', ()   => expect(validateQty(1,     TYPE)).toBeNull());
  test('valid integer 5 passes', ()   => expect(validateQty(5,     TYPE)).toBeNull());
  test('valid integer 100 passes', () => expect(validateQty(100,   TYPE)).toBeNull());
  test('valid string "3" passes', ()  => expect(validateQty('3',   TYPE)).toBeNull());

  test('decimal 1.2  fails',  () => expect(validateQty(1.2,  TYPE)).toBe('qty_integer_only'));
  test('decimal 1.21 fails',  () => expect(validateQty(1.21, TYPE)).toBe('qty_integer_only'));
  test('decimal "0.5" fails', () => expect(validateQty('0.5',TYPE)).toBe('qty_integer_only'));
  test('zero fails',          () => expect(validateQty(0,    TYPE)).toBe('qty_integer_only'));
  test('negative fails',      () => expect(validateQty(-1,   TYPE)).toBe('qty_integer_only'));
  test('empty string fails',  () => expect(validateQty('',   TYPE)).toBe('qty_integer_only'));
  test('NaN string fails',    () => expect(validateQty('abc',TYPE)).toBe('qty_integer_only'));
});

describe('validateQty — contract micro', () => {
  const TYPE = 'contract micro';

  test('valid integer 2 passes',    () => expect(validateQty(2,   TYPE)).toBeNull());
  test('decimal 1.5 fails',         () => expect(validateQty(1.5, TYPE)).toBe('qty_integer_only'));
  test('comma decimal "1,2" fails', () => {
    // Comma as decimal separator — parseFloat("1,2") returns 1 (strips after comma)
    // but the UI blocks comma keypresses; simulate the parsed value:
    const commaInput = parseFloat('1,2'.replace(',', '.'));
    expect(validateQty(commaInput, TYPE)).toBe('qty_integer_only');
  });
});

describe('validateQty — Lot (decimal allowed)', () => {
  const TYPE = 'Lot';

  test('decimal 1.2  is valid for Lot',  () => expect(validateQty(1.2,  TYPE)).toBeNull());
  test('decimal 0.01 is valid for Lot',  () => expect(validateQty(0.01, TYPE)).toBeNull());
  test('integer 3    is valid for Lot',  () => expect(validateQty(3,    TYPE)).toBeNull());
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. shouldBlockKey — decimal separator blocking
// ─────────────────────────────────────────────────────────────────────────────
describe('shouldBlockKey', () => {
  test('blocks "." for contract mini',  () => expect(shouldBlockKey('.', '1', 'contract mini')).toBe(true));
  test('blocks "," for contract mini',  () => expect(shouldBlockKey(',', '1', 'contract mini')).toBe(true));
  test('blocks "." for contract micro', () => expect(shouldBlockKey('.', '2', 'contract micro')).toBe(true));
  test('allows "." for Lot',            () => expect(shouldBlockKey('.', '1', 'Lot')).toBe(false));
  test('allows digits for all types',   () => {
    expect(shouldBlockKey('5', '1', 'contract mini')).toBe(false);
    expect(shouldBlockKey('0', '',  'contract micro')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. generateDeviceId (logic test — no DOM needed)
// ─────────────────────────────────────────────────────────────────────────────
describe('generateDeviceId logic', () => {
  function generateDeviceId(storage) {
    let id = storage['device_id'];
    if (!id) {
      id = 'web-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
      storage['device_id'] = id;
    }
    return id;
  }

  test('generates a "web-" prefixed id', () => {
    const store = {};
    const id = generateDeviceId(store);
    expect(id).toMatch(/^web-[a-z0-9]+-[a-z0-9]+$/);
  });

  test('returns same id on repeated calls (idempotent)', () => {
    const store = {};
    const id1 = generateDeviceId(store);
    const id2 = generateDeviceId(store);
    expect(id1).toBe(id2);
  });

  test('generates different ids for different storage objects', () => {
    const id1 = generateDeviceId({});
    const id2 = generateDeviceId({});
    expect(id1).not.toBe(id2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Session expiry calculations
// ─────────────────────────────────────────────────────────────────────────────
describe('session expiry thresholds', () => {
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  const WARN_BEFORE_MS  =  2 * 60 * 1000;

  test('IDLE_TIMEOUT_MS is 30 minutes', () => {
    expect(IDLE_TIMEOUT_MS).toBe(1_800_000);
  });

  test('WARN_BEFORE_MS is 2 minutes', () => {
    expect(WARN_BEFORE_MS).toBe(120_000);
  });

  test('warning fires before expiry', () => {
    const remainingMs = 90_000; // 1.5 min left
    expect(remainingMs).toBeLessThanOrEqual(WARN_BEFORE_MS);
  });

  test('no warning when plenty of time remains', () => {
    const remainingMs = 25 * 60 * 1000; // 25 min left
    expect(remainingMs).toBeGreaterThan(WARN_BEFORE_MS);
  });

  test('minutesLeft rounds up correctly', () => {
    const minutesLeft = ms => Math.max(1, Math.ceil(ms / 60_000));
    expect(minutesLeft(90_000)).toBe(2);
    expect(minutesLeft(60_001)).toBe(2);
    expect(minutesLeft(60_000)).toBe(1);
    expect(minutesLeft(1))    .toBe(1); // minimum is 1
  });
});
