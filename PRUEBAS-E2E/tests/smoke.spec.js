// Smoke — la PWA carga y renderiza sus vistas clave sin errores JS.
const { test, expect } = require('@playwright/test');

function capturarErrores(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  return errs;
}

test('home carga: cabecera, capas y barra inferior', async ({ page }) => {
  const errs = capturarErrores(page);
  const resp = await page.goto('./', { waitUntil: 'domcontentloaded' });
  expect(resp.status(), 'status HTTP').toBeLessThan(400);
  await expect(page.locator('.app-header h1')).toHaveText(/Programa Scout/);
  await page.waitForSelector('.layer-card');
  expect(await page.locator('.layer-card').count(), 'tarjetas de capa').toBeGreaterThanOrEqual(4);
  await expect(page.locator('.tabbar')).toBeVisible();
  expect(errs, `errores JS: ${errs.join(' | ')}`).toEqual([]);
});

test('una capa lista sus conceptos', async ({ page }) => {
  const errs = capturarErrores(page);
  await page.goto('./#/capa/transversal', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.list-item');
  expect(await page.locator('.list-item').count(), 'conceptos en capa 0').toBeGreaterThan(0);
  expect(errs, `errores JS: ${errs.join(' | ')}`).toEqual([]);
});

test('una ficha de concepto renderiza definición, práctica y cita', async ({ page }) => {
  const errs = capturarErrores(page);
  await page.goto('./#/concepto/metodo-scout', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.detail h2');
  await expect(page.locator('.detail h2')).toContainText(/Método Scout/);
  await expect(page.locator('.practice')).toBeVisible();
  await expect(page.locator('.cite')).toBeVisible();
  expect(errs, `errores JS: ${errs.join(' | ')}`).toEqual([]);
});

test('una ruta guiada muestra sus pasos', async ({ page }) => {
  await page.goto('./#/ruta/el-metodo-scout-paso-a-paso', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.route-steps');
  expect(await page.locator('.route-steps a').count(), 'pasos de la ruta').toBeGreaterThan(1);
});
