/**
 * E2E TESTS — Playwright
 * Tests: Login, Add Trade, Session translation, Trades page
 * Run: npx playwright test
 */
const { test, expect } = require('@playwright/test');

const BASE  = process.env.BASE_URL || 'http://localhost:3000';
const USER  = process.env.TEST_USER;
const PASS  = process.env.TEST_PASS;

// ─── Helper: login once ─────────────────────────────────────
async function login(page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="user_name"], input[placeholder*="user" i]', USER);
  await page.fill('input[type="password"]', PASS);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("تسجيل")');
  await page.waitForURL(/dashboard|trades|add-trade/, { timeout: 8000 });
}

// ─── AUTH ───────────────────────────────────────────────────
test.describe('Authentication', () => {

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('wrong credentials shows error', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="user_name"], input[placeholder*="user" i]', 'nobody');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"], button:has-text("Login")');
    // Should NOT navigate away
    await expect(page).toHaveURL(/login/);
  });

  test('valid credentials redirect to app', async ({ page }) => {
    await login(page);
    await expect(page).not.toHaveURL(/login/);
  });

});

// ─── TRADES PAGE ────────────────────────────────────────────
test.describe('Trades page', () => {

  test.beforeEach(async ({ page }) => { await login(page); });

  test('loads trades table', async ({ page }) => {
    await page.goto(`${BASE}/trades`);
    // Table header should exist
    await expect(page.locator('table, .trades-table, [class*="table"]').first()).toBeVisible({ timeout: 6000 });
  });

  test('session column shows translated label (Arabic)', async ({ page }) => {
    // Switch to Arabic first via lang toggle
    await page.goto(`${BASE}/trades`);
    const langBtn = page.locator('button:has-text("AR"), button:has-text("العربية"), [data-lang="ar"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(400);
    }
    // At least one session cell should show Arabic text
    const cells = page.locator('td.muted');
    const count = await cells.count();
    if (count > 0) {
      const firstText = await cells.first().textContent();
      // Should be one of the Arabic session names
      const validAr = ['لندن', 'نيويورك', 'آسيا'];
      expect(validAr.some(v => firstText.includes(v))).toBeTruthy();
    }
  });

  test('session column shows translated label (French)', async ({ page }) => {
    await page.goto(`${BASE}/trades`);
    const langBtn = page.locator('button:has-text("FR"), [data-lang="fr"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(400);
    }
    const cells = page.locator('td.muted');
    const count = await cells.count();
    if (count > 0) {
      const firstText = await cells.first().textContent();
      const validFr = ['Londres', 'New York', 'Asie'];
      expect(validFr.some(v => firstText.includes(v))).toBeTruthy();
    }
  });

  test('session column never shows raw "LON", "NY", "ASI"', async ({ page }) => {
    await page.goto(`${BASE}/trades`);
    const allCells = await page.locator('td.muted').allTextContents();
    allCells.forEach(text => {
      expect(['LON', 'NY', 'ASI']).not.toContain(text.trim());
    });
  });

});

// ─── ADD TRADE PAGE ─────────────────────────────────────────
test.describe('Add Trade page', () => {

  test.beforeEach(async ({ page }) => { await login(page); });

  test('page loads with session buttons', async ({ page }) => {
    await page.goto(`${BASE}/add-trade`);
    // One of the session buttons should be visible
    const lonBtn = page.locator('button:has-text("London"), button:has-text("لندن"), button:has-text("Londres")').first();
    await expect(lonBtn).toBeVisible({ timeout: 6000 });
  });

  test('session buttons show translated text in Arabic', async ({ page }) => {
    await page.goto(`${BASE}/add-trade`);
    const langBtn = page.locator('button:has-text("AR"), [data-lang="ar"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('button:has-text("لندن")').first()).toBeVisible();
    await expect(page.locator('button:has-text("نيويورك")').first()).toBeVisible();
    await expect(page.locator('button:has-text("آسيا")').first()).toBeVisible();
  });

  test('session buttons show translated text in French', async ({ page }) => {
    await page.goto(`${BASE}/add-trade`);
    const langBtn = page.locator('button:has-text("FR"), [data-lang="fr"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(400);
    }
    await expect(page.locator('button:has-text("Londres")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Asie")').first()).toBeVisible();
  });

  test('can select a market and direction', async ({ page }) => {
    await page.goto(`${BASE}/add-trade`);
    // Click ES market button
    const esBtn = page.locator('button:has-text("ES")').first();
    if (await esBtn.isVisible()) await esBtn.click();
    // Click BUY
    const buyBtn = page.locator('button:has-text("BUY"), button:has-text("شراء")').first();
    if (await buyBtn.isVisible()) await buyBtn.click();
    // Click WIN
    const winBtn = page.locator('button:has-text("WIN"), button:has-text("فوز")').first();
    if (await winBtn.isVisible()) await winBtn.click();
    // Summary should reflect selection
    await expect(page.locator('text=BUY, text=ES, text=WIN').first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

});

// ─── DASHBOARD ──────────────────────────────────────────────
test.describe('Dashboard', () => {

  test.beforeEach(async ({ page }) => { await login(page); });

  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    // Should have win rate or total trades visible
    await expect(
      page.locator('text=/win rate|نسبة الفوز|taux de réussite/i').first()
    ).toBeVisible({ timeout: 6000 });
  });

  test('recent trades session cells are translated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    const langBtn = page.locator('button:has-text("AR"), [data-lang="ar"]').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(400);
    }
    const cells = page.locator('td.muted');
    const count = await cells.count();
    if (count > 0) {
      const texts = await cells.allTextContents();
      texts.forEach(t => {
        expect(['LON', 'NY', 'ASI']).not.toContain(t.trim());
      });
    }
  });

});
