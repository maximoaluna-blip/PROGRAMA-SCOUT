// PWA — manifest válido y enlazado, service worker registrado, íconos accesibles.
const { test, expect } = require('@playwright/test');

test('el manifest está enlazado y es válido', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const href = await page.getAttribute('link[rel="manifest"]', 'href');
  expect(href, 'falta <link rel=manifest>').toBeTruthy();
  const resp = await page.request.get(new URL(href, page.url()).toString());
  expect(resp.status(), 'manifest HTTP').toBe(200);
  const man = await resp.json();
  expect(man.name, 'manifest.name').toBeTruthy();
  expect(man.start_url, 'manifest.start_url').toBeTruthy();
  expect(Array.isArray(man.icons) && man.icons.length, 'manifest.icons').toBeTruthy();
  expect(man.display, 'manifest.display').toBe('standalone');
});

test('el ícono declarado es accesible', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const resp = await page.request.get(new URL('./icons/icon.svg', page.url()).toString());
  expect(resp.status(), 'icono HTTP').toBe(200);
});

test('el service worker se registra (offline disponible)', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const registrado = await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const r = await navigator.serviceWorker.getRegistration();
    return !!r;
  }, null, { timeout: 15_000 }).then(() => true).catch(() => false);
  expect(registrado, 'el service worker debió registrarse').toBeTruthy();
});
