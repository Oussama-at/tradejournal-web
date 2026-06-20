// playwright.config.js
require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir:    './test/e2e',
  timeout:    20000,
  retries:    1,
  reporter:   'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace:   'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  ],
});
