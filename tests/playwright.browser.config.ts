import { defineConfig, devices } from '@playwright/test';

// Config for browser tests (TEAM3-142). The API tests (TEAM3-141) use playwright.config.ts.
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*-browser.spec.ts',
  fullyParallel: true,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Starts the frontend with the fake backend (MSW) before the tests
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    cwd: '../frontend',
    url: 'http://localhost:5173',
    env: { VITE_USE_MOCKS: 'true' },
    reuseExistingServer: false,
    timeout: 60_000,
  },
});