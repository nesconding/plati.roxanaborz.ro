import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'
import { resolve } from 'path'
import { register } from 'tsconfig-paths'
import { loadConfig } from 'tsconfig-paths'

// Load .env.test when running e2e tests
if (process.env.NODE_ENV === 'test') {
  config({ path: resolve(__dirname, '.env.test') })
}

// Register TypeScript path mappings for e2e tests
const tsConfigResult = loadConfig(resolve(__dirname, './'))
if (tsConfigResult.resultType === 'success') {
  register({
    baseUrl: tsConfigResult.absoluteBaseUrl,
    paths: tsConfigResult.paths
  })
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_BASE_URL || `http://localhost:${process.env.PORT || '9099'}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `next dev --turbopack -p ${process.env.PORT || '9099'}`,
    url: `http://localhost:${process.env.PORT || '9099'}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
