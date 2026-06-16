import { defineConfig, devices } from '@playwright/test';

// E2E runs against the built static site served by `astro preview`.
// Only `*.spec.ts` files are e2e (Vitest owns `*.test.ts`).
const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    // Chromium is enough for now; the on-device AI tier is Chromium-only anyway.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
