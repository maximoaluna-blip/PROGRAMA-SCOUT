// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Pruebas de la PWA "Programa Scout" (SPA con enrutado por hash, sin backend).
 *
 * Por defecto Playwright levanta un servidor estatico local (webServer) que sirve
 * la raiz del repo en localhost:8123 — funciona igual en local y en CI.
 * Para correr contra otra URL (p. ej. produccion), exporta PS_BASE_URL y no se
 * arranca el servidor local.
 */
const PORT = 8123;
const PY = process.platform === 'win32' ? 'python' : 'python3';
const usarLocal = !process.env.PS_BASE_URL;
const BASE_URL = process.env.PS_BASE_URL || `http://localhost:${PORT}/`;

module.exports = defineConfig({
  webServer: usarLocal
    ? {
        command: `${PY} -m http.server ${PORT} --bind 127.0.0.1 --directory ..`,
        url: `http://localhost:${PORT}/index.html`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      }
    : undefined,
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'movil-android',
      use: { ...devices['Pixel 5'] },
      // a11y y data corren solo en escritorio para no duplicar.
      grepInvert: /@solo-escritorio/,
    },
  ],
});
