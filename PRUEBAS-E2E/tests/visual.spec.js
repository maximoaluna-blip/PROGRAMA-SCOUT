// Sistema visual — sprite de íconos, ficha con fuente al final y tinte por rama.
const { test, expect } = require('./_base');

test('la barra inferior usa íconos SVG del sprite', async ({ page }) => {
  await page.goto('./#/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.layer-card');
  const tabs = page.locator('.tabbar a');
  await expect(tabs).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    expect(await tabs.nth(i).locator('svg use[href^="#i-"]').count(), `pestaña ${i} sin ícono del sprite`).toBe(1);
  }
  const texto = await page.locator('.tabbar').innerText();
  expect(/\p{Extended_Pictographic}/u.test(texto), `emoji en la barra: ${texto}`).toBe(false);
});

test('la ficha termina en su fuente oficial', async ({ page }) => {
  await page.goto('./#/concepto/metodo-scout', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.detail h2');
  const ultimo = page.locator('.detail > :last-child');
  await expect(ultimo).toHaveClass(/\bfuente\b/);
  expect((await ultimo.innerText()).trim().length, 'fuente vacía').toBeGreaterThan(0);
});

test('la ficha de rama se tiñe con su color', async ({ page }) => {
  await page.goto('./#/concepto/manada-lobatos', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.detail h2');
  await expect(page.locator('.detail[data-rama="lobatos"]')).toHaveCount(1);
  const fondo = await page.locator('.detail .cinta').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(fondo).toBe('rgb(255, 208, 15)');
});
