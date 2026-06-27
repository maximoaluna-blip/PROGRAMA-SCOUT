// Búsqueda — incluye el test de REGRESIÓN del bug del foco:
// al escribir varias letras seguidas, el cuadro no debe perder el foco.
const { test, expect } = require('@playwright/test');

test('escribir varias letras NO pierde el foco (regresión)', async ({ page }) => {
  await page.goto('./#/buscar/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#q-input');
  await input.click();
  // pressSequentially escribe letra por letra; si el foco se perdiera, el valor
  // no llegaría completo a "educa".
  await input.pressSequentially('educa', { delay: 60 });
  await expect(input).toHaveValue('educa');
  const enfocado = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(enfocado, 'el input debe seguir enfocado').toBe('q-input');
});

test('los resultados se actualizan en vivo', async ({ page }) => {
  await page.goto('./#/buscar/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#q-input');
  await input.click();
  await input.pressSequentially('metodo', { delay: 40 });
  await page.waitForSelector('#search-results .list-item');
  expect(await page.locator('#search-results .list-item').count(), 'resultados').toBeGreaterThan(0);
});

test('consulta sin resultados muestra estado vacío', async ({ page }) => {
  await page.goto('./#/buscar/', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#q-input');
  await input.click();
  await input.pressSequentially('zzzxyq', { delay: 30 });
  await expect(page.locator('#search-results .empty')).toBeVisible();
});
