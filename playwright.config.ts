import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.HYPERCRYPT_E2E_PORT ?? 4187);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 820 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI && !process.env.HYPERCRYPT_E2E_PORT,
    timeout: 30_000,
  },
});
