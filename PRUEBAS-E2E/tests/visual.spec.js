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

// WCAG 1.4.11: el indicador de foco necesita ≥ 3:1 contra el fondo de la página.
function luminancia(rgb) {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

for (const tema of ['light', 'dark']) {
  test(`el foco de teclado se ve (≥ 3:1) [${tema}]`, async ({ page }) => {
    await page.addInitScript((t) => { try { localStorage.setItem('ps-theme', t); } catch (e) {} }, tema === 'dark' ? 'dark' : '');
    await page.goto('./#/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.layer-card');
    let enCapa = false;
    for (let i = 0; i < 15 && !enCapa; i++) {
      await page.keyboard.press('Tab');
      enCapa = await page.evaluate(() => document.activeElement?.classList.contains('layer-card'));
    }
    expect(enCapa, 'el Tab no llegó a una tarjeta de capa').toBe(true);
    const { foco, fondo, estilo } = await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return { foco: cs.outlineColor, estilo: cs.outlineStyle, fondo: getComputedStyle(document.body).backgroundColor };
    });
    expect(estilo, 'sin outline de foco').not.toBe('none');
    const c = contraste(foco, fondo);
    expect(c, `foco ${foco} sobre ${fondo} = ${c.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
}
