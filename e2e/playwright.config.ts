/**
 * Playwright E2E Test Configuration
 *
 * @module e2e/playwright.config
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',

  // Test file patterns
  testMatch: '**/*.e2e.ts',

  // Timeout for each test
  timeout: 30000,

  // Expect timeout
  expect: {
    timeout: 5000,
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: './reports/html' }],
    ['json', { outputFile: './reports/results.json' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the frontend
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // API URL for direct API tests
    extraHTTPHeaders: {
      'X-API-URL': process.env.E2E_API_URL || 'http://localhost:3001',
    },

    // Capture trace on first retry
    trace: 'on-first-retry',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture video on failure
    video: 'on-first-retry',

    // Accept downloads
    acceptDownloads: true,

    // Viewport size
    viewport: { width: 1280, height: 720 },
  },

  // Projects (browsers to test)
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],

  // Web server to start before tests
  webServer: [
    {
      command: 'npm run dev:backend',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      cwd: '../',
    },
    {
      command: 'npm run dev:frontend',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      cwd: '../apps/guardian-ui',
    },
  ],

  // Global setup/teardown
  globalSetup: './setup/global-setup.ts',
  globalTeardown: './setup/global-teardown.ts',

  // Output directory for test artifacts
  outputDir: './reports/test-results',
});







