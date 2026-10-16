// Progreso conectado: lectura real (la fuente entra en pantalla), parches, ruta que crece y reinicio.
const { test, expect } = require('./_base');

const CLAVE = 'ps-progreso-v1';
const guardado = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), CLAVE);

async function bajarALaFuente(page) {
  await page.locator('.detail .fuente').evaluate((el) => el.scrollIntoView({ block: 'center' }));
}

async function leerFicha(page, hash, id) {
  await page.goto(hash);
  await expect(page.locator('.detail h2')).toBeVisible();
  await bajarALaFuente(page);
  await expect.poll(async () => Boolean(((await guardado(page)).leidas || {})[id])).toBe(true);
}

test('leer hasta la fuente marca la ficha', async ({ page }) => {
  await leerFicha(page, './#/concepto/metodo-scout', 'metodo-scout');
  await page.goto('./#/capa/transversal');
  await expect(page.locator('.list-item[href="#/concepto/metodo-scout"]')).toHaveClass(/\bleida\b/);
  await page.goto('./#/');
  await expect(page.locator('.bitacora-barra')).toHaveAttribute('data-leidas', '1');
});

test('abrir sin bajar no cuenta', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 300 });
  const id = await (await page.request.get('./data/conceptos.json')).json().then((cs) =>
    cs.reduce((a, c) => (c.definicion.length + c.enLaPractica.length > a.definicion.length + a.enLaPractica.length ? c : a)).id);
  await page.goto(`./#/concepto/${id}`);
  await expect(page.locator('.detail h2')).toBeVisible();
  await page.waitForTimeout(600);
  await page.goto('./#/');
  await expect(page.locator('.bitacora-barra')).toHaveAttribute('data-leidas', '0');
});

test('completar conoce-rovers gana el parche', async ({ page }) => {
  await page.addInitScript(() => {
    window.__parches = [];
    document.addEventListener('ps:parche', (e) => window.__parches.push(e.detail.parche.id));
  });
  const pasos = ['clan-rovers', 'marco-simbolico-rovers', 'progresion-rovers', 'dirigente-rovers'];
  for (let i = 0; i < pasos.length; i++) {
    await leerFicha(page, `./#/concepto/${pasos[i]}?ruta=conoce-rovers&paso=${i + 1}`, pasos[i]);
  }
  await expect.poll(() => page.evaluate(() => window.__parches)).toContain('conoce-rovers');
  await page.goto('./#/mochila');
  const p = page.locator('.parche[data-id="conoce-rovers"]');
  await expect(p).toHaveClass(/\bganado\b/);
  await expect(p).toContainText(/\d{2}\/\d{2}\/\d{4}/);
});

test('no se repite la celebración', async ({ page }) => {
  await page.addInitScript(() => {
    window.__nuevas = [];
    document.addEventListener('ps:leida', (e) => { if (e.detail.nueva) window.__nuevas.push(e.detail.id); });
  });
  await leerFicha(page, './#/concepto/metodo-scout', 'metodo-scout');
  await expect.poll(() => page.evaluate(() => window.__nuevas.length)).toBe(1);
  await page.goto('./#/');
  await leerFicha(page, './#/concepto/metodo-scout', 'metodo-scout');
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.__nuevas.length)).toBe(1);
});

test('ruta que creció', async ({ page }) => {
  await page.addInitScript((k) => {
    localStorage.setItem(k, JSON.stringify({
      bienvenida: true, sonido: false,
      parches: { 'conoce-rovers': '2026-10-01' },
      leidas: { 'clan-rovers': '2026-10-01', 'marco-simbolico-rovers': '2026-10-01', 'progresion-rovers': '2026-10-01' },
    }));
  }, CLAVE);
  await page.goto('./#/ruta/conoce-rovers');
  await expect(page.locator('.aviso-ruta-nueva')).toBeVisible();
  await page.goto('./#/mochila');
  await expect(page.locator('.parche[data-id="conoce-rovers"]')).toHaveClass(/\bganado\b/);
});

test('almacenamiento bloqueado', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new Error('bloqueado'); };
  });
  await page.goto('./#/concepto/metodo-scout');
  await expect(page.locator('.detail h2')).toBeVisible();
  await bajarALaFuente(page);
  await page.waitForTimeout(400);
  await page.goto('./#/capa/transversal');
  await expect(page.locator('.list-item[href="#/concepto/metodo-scout"]')).toHaveClass(/\bleida\b/);
  await page.goto('./#/mochila');
  await expect(page.locator('.aviso-almacen')).toBeVisible();
  expect(errores).toEqual([]);
});

test('reiniciar', async ({ page }) => {
  const pasos = ['clan-rovers', 'marco-simbolico-rovers', 'progresion-rovers', 'dirigente-rovers'];
  for (let i = 0; i < pasos.length; i++) {
    await leerFicha(page, `./#/concepto/${pasos[i]}?ruta=conoce-rovers&paso=${i + 1}`, pasos[i]);
  }
  await page.goto('./#/mochila');
  await expect(page.locator('.parche.ganado')).not.toHaveCount(0);
  page.once('dialog', (d) => { expect(d.message()).toBe('¿Borrar tu avance en este teléfono?'); d.accept(); });
  await page.locator('#reiniciar-avance').click();
  await expect(page.locator('.parche.ganado')).toHaveCount(0);
  await page.goto('./#/');
  await expect(page.locator('.bitacora-barra')).toHaveAttribute('data-leidas', '0');
});

test('sigue donde ibas', async ({ page }) => {
  await page.goto('./#/concepto/educacion-no-formal?ruta=por-que-educamos&paso=2');
  await expect(page.locator('.detail h2')).toBeVisible();
  await page.goto('./#/');
  const sd = page.locator('.sigue-donde a');
  await expect(sd).toHaveAttribute('href', '#/ruta/por-que-educamos');
  await expect(sd).toContainText('Paso 2');
});

test('siguiente en la ruta', async ({ page }) => {
  await page.goto('./#/concepto/proposito-del-movimiento?ruta=por-que-educamos&paso=1');
  await expect(page.locator('.detail h2')).toBeVisible();
  await expect(page.locator('.siguiente-en-ruta a')).toHaveAttribute('href', /#\/concepto\/educacion-no-formal/);
});

test('ficha del día nueva para ti', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.locator('.ficha-dia.nueva')).toHaveCount(1);
  const href = await page.locator('.ficha-dia a.fd-tarjeta').getAttribute('href');
  const id = href.split('/').pop();
  await leerFicha(page, `./${href}`, id);
  await page.goto('./#/');
  await expect(page.locator('.ficha-dia')).toBeVisible();
  await expect(page.locator('.ficha-dia.nueva')).toHaveCount(0);
  await expect(page.locator('.ficha-dia .nueva')).toHaveCount(0);
});

test('reiniciar conserva las preferencias de sonido y bienvenida', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ps-progreso-v1', JSON.stringify({
      bienvenida: true, sonido: true,
      leidas: { 'clan-rovers': '2026-10-01' },
      parches: { 'conoce-rovers': '2026-10-01' },
    }));
  });
  await page.goto('./#/mochila');
  page.once('dialog', (d) => d.accept());
  await page.locator('#reiniciar-avance').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ps-progreso-v1') || '{}').parches))
    .toEqual({});
  const g = await guardado(page);
  expect(g.sonido).toBe(true);
  expect(g.bienvenida).toBe(true);
  expect(g.leidas).toEqual({});
});
