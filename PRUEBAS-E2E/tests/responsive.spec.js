// Responsive — corre en escritorio y en móvil (Pixel 5, ver projects).
// Verifica que no haya scroll horizontal y que los elementos clave sean visibles.
const { test, expect } = require('./_base');

const VISTAS = [
  { nombre: 'home', hash: './#/', espera: '.layer-card' },
  { nombre: 'concepto', hash: './#/concepto/metodo-scout', espera: '.detail h2' },
  { nombre: 'capa-ramas', hash: './#/capa/ramas', espera: '.panal .hex-rama' },
  { nombre: 'ruta', hash: './#/ruta/conoce-rovers', espera: '.sendero .paso' },
  { nombre: 'mochila', hash: './#/mochila', espera: '.parche' },
];

for (const v of VISTAS) {
  test(`sin scroll horizontal: ${v.nombre}`, async ({ page }) => {
    await page.goto(v.hash, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(v.espera);
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return { scroll: d.scrollWidth, vista: window.innerWidth };
    });
    // Tolerancia de 2px por redondeos.
    expect(overflow.scroll, `scrollWidth(${overflow.scroll}) > viewport(${overflow.vista})`)
      .toBeLessThanOrEqual(overflow.vista + 2);
  });
}

test('la barra inferior de navegación es visible', async ({ page }) => {
  await page.goto('./#/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.layer-card');
  await expect(page.locator('.tabbar')).toBeVisible();
  expect(await page.locator('.tabbar a').count(), 'pestañas').toBeGreaterThanOrEqual(3);
});
