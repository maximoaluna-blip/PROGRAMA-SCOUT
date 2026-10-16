// Bienvenida: se muestra sola en la primera visita (solo en #/ vacío), guarda la
// elección de sonido al empezar y se puede volver a abrir desde «Acerca de».
// Usa @playwright/test directo (no _base): el almacenamiento empieza vacío.
const { test, expect } = require('@playwright/test');

const CLAVE = 'ps-progreso-v1';
const guardado = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), CLAVE);
const FRASES = [
  'Consulta el Programa de Jóvenes: aquí no se certifica, se aclara.',
  'Todo lo que ves tiene su fuente oficial.',
  'Tu avance queda guardado en este teléfono.',
];

// Cuenta los arranques y paradas de fuentes en bucle (el crepitar de la fogata).
async function contarFogata(page) {
  await page.addInitScript(() => {
    window.__fogata = { inicios: 0, paradas: 0 };
    const P = window.AudioBufferSourceNode && window.AudioBufferSourceNode.prototype;
    if (!P) return;
    const start = P.start, stop = P.stop;
    P.start = function (...a) { if (this.loop) window.__fogata.inicios++; return start.apply(this, a); };
    P.stop = function (...a) { if (this.loop) window.__fogata.paradas++; return stop.apply(this, a); };
  });
}
const fogata = (page) => page.evaluate(() => window.__fogata);

test('la primera visita abre la bienvenida', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveURL(/#\/bienvenida$/);
  await expect(page.locator('.bienvenida .escena')).toHaveCount(1);
  await expect(page.locator('.bienvenida .esc-fogata')).toBeVisible();
  const sw = page.locator('#sonido-toggle');
  await expect(sw).toHaveAttribute('role', 'switch');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('label[for="sonido-toggle"]')).toHaveText('¿Activar sonidos?');
  for (const f of FRASES) await expect(page.locator('.bienvenida')).toContainText(f);
  await expect(page.locator('#empezar')).toHaveText('Empezar');
  // La flor de lis no es parte de la escena.
  expect(await page.locator('.bienvenida [src$="icon.svg"]').count()).toBe(0);
});

test('empezar guarda y no vuelve a aparecer', async ({ page }) => {
  await page.goto('./');
  const sw = page.locator('#sonido-toggle');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#sonido-btn')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#empezar').click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.layer-card').first()).toBeVisible();
  const g = await guardado(page);
  expect(g.bienvenida).toBe(true);
  expect(g.sonido).toBe(true);
  await expect(page.locator('#sonido-btn')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.bienvenida')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.layer-card').first()).toBeVisible();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.bienvenida')).toHaveCount(0);
});

test('empezar sin activar deja el sonido apagado', async ({ page }) => {
  await page.goto('./');
  await page.locator('#empezar').click();
  await expect(page.locator('.layer-card').first()).toBeVisible();
  const g = await guardado(page);
  expect(g.bienvenida).toBe(true);
  expect(g.sonido).toBe(false);
  await expect(page.locator('#sonido-btn')).toHaveAttribute('aria-pressed', 'false');
});

test('el interruptor se maneja con el teclado', async ({ page }) => {
  await page.goto('./');
  const sw = page.locator('#sonido-toggle');
  await sw.focus();
  await page.keyboard.press('Space');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
});

test('un enlace profundo en primera visita respeta el destino', async ({ page }) => {
  await page.goto('./#/concepto/metodo-scout');
  await expect(page.locator('.detail h2')).toBeVisible();
  await expect(page).toHaveURL(/#\/concepto\/metodo-scout$/);
  await expect(page.locator('.bienvenida')).toHaveCount(0);
});

test('«Acerca de» la vuelve a abrir', async ({ page }) => {
  await page.goto('./');
  await page.locator('#empezar').click();
  const enlace = page.locator('a[href="#/bienvenida"]');
  await expect(enlace).toHaveCount(1);
  await enlace.click();
  await expect(page).toHaveURL(/#\/bienvenida$/);
  await expect(page.locator('#empezar')).toBeVisible();
  // Ya no es la primera vez: el interruptor refleja lo guardado y Empezar vuelve a Inicio.
  await expect(page.locator('#sonido-toggle')).toHaveAttribute('aria-checked', 'false');
  await page.locator('#empezar').click();
  await expect(page.locator('.layer-card').first()).toBeVisible();
});

test('la barra inferior no estorba en la bienvenida', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#empezar')).toBeVisible();
  await expect(page.locator('.tabbar')).toBeHidden();
  await page.locator('#empezar').click();
  await expect(page.locator('.tabbar')).toBeVisible();
});

test('la fogata suena solo con sonido activo: enciende, apaga y vuelve', async ({ page }) => {
  await contarFogata(page);
  await page.goto('./');
  const sw = page.locator('#sonido-toggle');
  await expect(sw).toBeVisible();
  await page.waitForTimeout(200);
  expect(await fogata(page)).toEqual({ inicios: 0, paradas: 0 });
  await sw.click();
  await expect.poll(() => fogata(page)).toEqual({ inicios: 1, paradas: 0 });
  await sw.click();
  await expect.poll(() => fogata(page)).toEqual({ inicios: 1, paradas: 1 });
  await sw.click();
  await expect.poll(() => fogata(page)).toEqual({ inicios: 2, paradas: 1 });
  // Al salir de la bienvenida la fogata se apaga.
  await page.locator('#empezar').click();
  await expect(page.locator('.layer-card').first()).toBeVisible();
  await expect.poll(() => fogata(page)).toEqual({ inicios: 2, paradas: 2 });
  // En Inicio no suena aunque el sonido siga activo.
  await page.locator('.layer-card').first().click();
  await page.waitForTimeout(200);
  expect((await fogata(page)).inicios).toBe(2);
});

test('con movimiento reducido no hay ambiente ni rebote', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.locator('.bienvenida .escena')).toHaveCount(1);
  await page.waitForTimeout(300);
  const corriendo = await page.evaluate(() => document.querySelector('.bienvenida')
    .getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length);
  expect(corriendo).toBe(0);
  await expect(page.locator('.bv-titulo')).toBeVisible();
  await expect(page.locator('#empezar')).toBeVisible();
});
