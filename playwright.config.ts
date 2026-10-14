import { defineConfig, devices } from '@playwright/test'

const AUTH_STATE_PATH = 'e2e/.auth/borrower.json'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Several specs hit the local fch-backend-api dev server directly, which
  // isn't built for concurrency; running multiple spec files in parallel
  // workers starves individual requests and produces flaky timeouts.
  workers: 1,
  timeout: 180_000,
  // `php artisan serve` handles one request at a time, so a page that fires
  // several API calls waits for all of them in turn; under a full run a page
  // with several calls can take 30s+, and some tests load three or four pages.
  expect: { timeout: 45_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Logs in once and saves the session for the authenticated projects.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    // Login / guest pages: must start without a session.
    {
      name: 'guest',
      testMatch: /auth\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Everything reachable from the sidebar, one folder per menu item.
    {
      name: 'chromium',
      testMatch: /(sidebar|topbar|pages)\/.*\.spec\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE_PATH },
    },
  ],
  webServer: {
    // Build first: `vite preview` serves whatever is in dist/, which is
    // otherwise a stale build that doesn't match the code under test.
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
})
