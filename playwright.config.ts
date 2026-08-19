import { defineConfig, devices } from '@playwright/test';

const VIEWPORT = { width: 1920, height: 1080 };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  // Aplikacja nie ma zadnej losowosci (spec sekcja 3), wiec test niestabilny
  // oznacza blad w tescie, nie pecha — ma byc widoczny od razu.
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    viewport: VIEWPORT,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: VIEWPORT },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
