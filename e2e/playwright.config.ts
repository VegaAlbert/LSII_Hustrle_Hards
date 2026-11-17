import { defineConfig, devices } from '@playwright/test';
import { BACKEND_URL, FRONTEND_PORT, FRONTEND_URL } from './env';

/**
 * NFR-02: E2E suite of the MVP golden paths. Playwright starts its own backend and frontend on ports that do not
 * clash with the usual dev servers (8080 / 5173), so a fresh environment is used even while developing.
 */
export default defineConfig({
  testDir: './tests',
  // Tests share one backend; each test creates its own user and data, so they can still run in parallel
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: FRONTEND_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // The detail page autoplays the video with sound, which Chromium blocks without a user gesture
        launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
      },
    },
  ],
  webServer: [
    {
      command: 'node scripts/start-backend.mjs',
      url: `${BACKEND_URL}/api/videos`,
      // Maven may have to download dependencies on the first run
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      cwd: '../frontend',
      url: FRONTEND_URL,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      // Variables already in the environment take priority over frontend/.env.development in Vite
      env: {
        VITE_API_DOMAIN: BACKEND_URL,
        VITE_MEDIA_DOMAIN: BACKEND_URL,
        // Hides the "Sign in with Google" button: it needs a real Google account
        VITE_GOOGLE_CLIENT_ID: '',
      },
    },
  ],
});
