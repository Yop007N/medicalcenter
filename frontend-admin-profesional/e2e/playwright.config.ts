import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Medical Services E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for the application
    baseURL: process.env.BASE_URL || 'http://localhost:4200',

    // Collect trace when retrying the failed test
    trace: 'on',

    // Screenshot on failure
    screenshot: 'on',

    // Video recording - always on for demos
    video: 'on',

    // Timeout for each action
    actionTimeout: 15000,

    // Timeout for navigation
    navigationTimeout: 45000,

    // Slow down actions for better video recording
    launchOptions: {
      slowMo: 100,
    },
  },

  // Global timeout for each test
  timeout: 120000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    // Setup project - runs before tests that need authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // UI tests - no authentication required
    {
      name: 'ui-tests',
      testMatch: /ui\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      // No dependencies - these tests work without backend
    },

    // Full E2E tests - require backend and authentication
    {
      name: 'chromium',
      testIgnore: /ui\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      testIgnore: /ui\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      testIgnore: /ui\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
    },

    // Mobile viewports
    {
      name: 'Mobile Chrome',
      testIgnore: /ui\.spec\.ts/,
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      testIgnore: /ui\.spec\.ts/,
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    // Tablet viewport
    {
      name: 'Tablet',
      testIgnore: /ui\.spec\.ts/,
      use: {
        ...devices['iPad (gen 7)'],
      },
      dependencies: ['setup'],
    },
  ],

  // Run your local dev server before starting the tests
  // Uncomment when the app compiles successfully
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:4200',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
