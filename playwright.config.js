// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir:    './tests/e2e',
  timeout:    20000,
  retries:    1,
  reporter:   'html',

  use: {
    baseURL:       process.env.BASE_URL || 'http://localhost:3000',
    headless:      true,
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox',  use: { browserName: 'firefox'  } },
  ],
});
