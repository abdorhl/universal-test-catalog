// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const LENIENT = process.env.LENIENT === '1';

module.exports = defineConfig({
  testDir: './tests/web',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: process.env.TARGET_URL || 'https://example.com',
    trace: 'on-first-retry',
    actionTimeout: LENIENT ? 45_000 : 15_000,
    navigationTimeout: LENIENT ? 60_000 : 30_000,
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
