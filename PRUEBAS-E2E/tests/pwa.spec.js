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

test('los íconos declarados son accesibles', async ({ page }) => {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const manHref = await page.getAttribute('link[rel="manifest"]', 'href');
  const manUrl = new URL(manHref, page.url()).toString();
  const man = await (await page.request.get(manUrl)).json();
  for (const icon of man.icons) {
    const resp = await page.request.get(new URL(icon.src, manUrl).toString());
    expect(resp.status(), `icono ${icon.src} HTTP`).toBe(200);
  }
  // iOS no usa el manifest ni acepta SVG: necesita un apple-touch-icon PNG.
  const apple = await page.getAttribute('link[rel="apple-touch-icon"]', 'href');
  expect(apple, 'apple-touch-icon').toMatch(/\.png$/);
  const resp = await page.request.get(new URL(apple, page.url()).toString());
  expect(resp.status(), 'apple-touch-icon HTTP').toBe(200);
  // Android pide al menos un PNG de 192 y uno de 512, y uno maskable.
  const sizes = man.icons.filter((i) => i.type === 'image/png').map((i) => i.sizes);
  expect(sizes, 'PNG 192 y 512').toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(man.icons.some((i) => (i.purpose || '').includes('maskable')), 'ícono maskable').toBeTruthy();
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
