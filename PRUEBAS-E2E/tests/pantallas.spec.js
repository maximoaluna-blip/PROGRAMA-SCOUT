// Pantallas del rediseño (Task 5): Inicio, panal de la Capa 2, sendero de la
// ruta, búsqueda resaltada y Mochila. Solo marcado y datos; leer y marcar
// fichas llega en la Task 6.
const { test, expect } = require('./_base');

test('inicio muestra bitácora, capas y ficha del día', async ({ page }) => {
  await page.goto('./#/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.layer-card');
  await expect(page.locator('.bitacora-barra')).toHaveAttribute('data-total', '77');
  await expect(page.locator('.bitacora-barra')).toHaveAttribute('data-leidas', '0');
  await expect(page.locator('.layer-card')).toHaveCount(4);
  await expect(page.locator('.layer-card[data-capa] .anillo[data-pct]')).toHaveCount(4);
  await expect(page.locator('.ficha-dia a[href^="#/concepto/"]').first()).toBeVisible();
  await expect(page.locator('.saludo')).toHaveText(/^Buen(os días|as tardes|as noches)/);
  // Sin «ultima» guardada no hay «Sigue donde ibas».
  await expect(page.locator('.sigue-donde')).toHaveCount(0);
});

test('«Sigue donde ibas» aparece cuando hay una última ruta', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ps-progreso-v1', JSON.stringify({
      bienvenida: true, sonido: false, ultima: { ruta: 'conoce-rovers', paso: 1 },
    }));
  });
  await page.goto('./#/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.layer-card');
  await expect(page.locator('.sigue-donde a[href="#/ruta/conoce-rovers"]')).toBeVisible();
});

test('la capa 2 es un panal de 5 ramas', async ({ page }) => {
  await page.goto('./#/capa/ramas', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.panal');
  await expect(page.locator('.panal .hex-rama')).toHaveCount(5);
  await page.locator('.panal .hex-rama[data-rama="lobatos"]').click();
  const fichas = page.locator('.list-item[data-rama]');
  await expect(fichas.first()).toBeVisible();
  const ramas = await fichas.evaluateAll((els) => els.filter((e) => e.offsetParent).map((e) => e.dataset.rama));
  expect(ramas.length, 'fichas visibles').toBeGreaterThan(0);
  expect(new Set(ramas), 'solo fichas de lobatos').toEqual(new Set(['lobatos']));
});

test('la ruta es un sendero', async ({ page }) => {
  await page.goto('./#/ruta/conoce-rovers', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sendero');
  await expect(page.locator('.sendero .paso')).toHaveCount(4);
  await expect(page.locator('.sendero .paso[data-id]')).toHaveCount(4);
  await expect(page.locator('.sendero .paso.leido')).toHaveCount(0);
});

test('la mochila lista 13 parches', async ({ page }) => {
  await page.goto('./#/mochila', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.parche');
  await expect(page.locator('.parche')).toHaveCount(13);
  await expect(page.locator('.parche[data-id]')).toHaveCount(13);
  await expect(page.locator('.parche.ganado')).toHaveCount(0);
  await expect(page.locator('#reiniciar-avance')).toBeVisible();
  await expect(page.locator('.tabbar a[data-route="mochila"]')).toHaveClass(/\bactive\b/);
  await expect(page.locator('.aviso-almacen')).toHaveCount(0);
});

test('la mochila muestra ganado un parche con su fecha', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ps-progreso-v1', JSON.stringify({
      bienvenida: true, sonido: false, parches: { 'conoce-rovers': '2026-10-15' },
    }));
  });
  await page.goto('./#/mochila', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.parche');
  await expect(page.locator('.parche.ganado')).toHaveCount(1);
  await expect(page.locator('.parche.ganado[data-id="conoce-rovers"]')).toContainText('15/10/2026');
});

test('buscar resalta el término con <mark>, sin importar tildes', async ({ page }) => {
  await page.goto('./#/buscar/metodo', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#search-results .list-item');
  const marcas = page.locator('#search-results mark');
  expect(await marcas.count(), 'marcas').toBeGreaterThan(0);
  const textos = await marcas.allInnerTexts();
  expect(textos.some((t) => /^m[eé]todo$/i.test(t)), `marcas: ${textos.slice(0, 5)}`).toBe(true);
});

test('buscar no inyecta HTML de la consulta', async ({ page }) => {
  await page.goto('./#/buscar/' + encodeURIComponent('<b>metodo</b>'), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#q-input');
  await expect(page.locator('#search-results b')).toHaveCount(0);
});
