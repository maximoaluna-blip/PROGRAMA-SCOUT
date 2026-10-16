// Sonido sintetizado: nada se crea sin sonido activo ni sin gesto; el interruptor persiste.
const { test, expect } = require('./_base');

const CLAVE = 'ps-progreso-v1';
const guardado = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), CLAVE);

// Cuenta cuántos AudioContext se construyen.
async function contarContextos(page) {
  await page.addInitScript(() => {
    window.__ctx = 0;
    for (const nombre of ['AudioContext', 'webkitAudioContext']) {
      const Original = window[nombre];
      if (!Original) continue;
      window[nombre] = class extends Original {
        constructor(...args) { super(...args); window.__ctx++; }
      };
    }
  });
}

async function sembrar(page, sonido) {
  await page.addInitScript((s) => {
    // Pisa lo que sembró _base, pero una sola vez: una recarga no debe deshacer el estado.
    if (sessionStorage.getItem('__sembrado') === null) {
      sessionStorage.setItem('__sembrado', '1');
      localStorage.setItem('ps-progreso-v1', JSON.stringify({ bienvenida: true, sonido: s }));
    }
  }, sonido);
}

test('sin sonido no se crea AudioContext', async ({ page }) => {
  await contarContextos(page);
  await sembrar(page, false);
  await page.goto('./#/');
  const tarjetas = page.locator('.layer-card');
  await expect(tarjetas.first()).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await tarjetas.nth(i).click();
    await page.goto('./#/');
    await expect(tarjetas.first()).toBeVisible();
  }
  expect(await page.evaluate(() => window.__ctx)).toBe(0);
});

test('con sonido se crea al primer toque, no antes', async ({ page }) => {
  await contarContextos(page);
  await sembrar(page, true);
  await page.goto('./#/');
  await expect(page.locator('.layer-card').first()).toBeVisible();
  expect(await page.evaluate(() => window.__ctx)).toBe(0);
  await page.locator('.layer-card').first().click();
  await expect.poll(() => page.evaluate(() => window.__ctx)).toBe(1);
  await page.locator('.tabbar a').first().click();
  await page.locator('.tabbar a').nth(1).click();
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__ctx)).toBe(1);
});

test('el botón de la cabecera alterna y persiste', async ({ page }) => {
  await sembrar(page, false);
  await page.goto('./#/');
  const btn = page.locator('#sonido-btn');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('aria-label', 'Sonido');
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  expect((await guardado(page)).sonido).toBe(true);
  await page.reload();
  await expect(page.locator('#sonido-btn')).toHaveAttribute('aria-pressed', 'true');
  expect((await guardado(page)).sonido).toBe(true);
  await page.locator('#sonido-btn').click();
  await expect(page.locator('#sonido-btn')).toHaveAttribute('aria-pressed', 'false');
  expect((await guardado(page)).sonido).toBe(false);
});
