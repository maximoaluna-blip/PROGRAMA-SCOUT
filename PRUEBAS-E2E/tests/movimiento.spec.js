// Movimiento: escena de campamento en Inicio, celebración de parches y transiciones.
// Con movimiento reducido no hay ambiente ni chispas; la flor de lis nunca se anima.
const { test, expect } = require('./_base');
const AxeBuilder = require('@axe-core/playwright').default;

const CLAVE = 'ps-progreso-v1';
const PASOS = ['clan-rovers', 'marco-simbolico-rovers', 'progresion-rovers', 'dirigente-rovers'];

// Siembra el estado una sola vez por pestaña: una recarga no lo deshace.
async function sembrar(page, estado) {
  await page.addInitScript(([k, e]) => {
    if (sessionStorage.getItem('__sembrado') === null) {
      sessionStorage.setItem('__sembrado', '1');
      localStorage.setItem(k, JSON.stringify(e));
    }
  }, [CLAVE, { bienvenida: true, sonido: false, ...estado }]);
}

const leidas = (ids) => Object.fromEntries(ids.map((id) => [id, '2026-10-01']));

// Abre la ficha, deja el foco en «Volver» y baja hasta la fuente (la lectura real).
async function leerConFoco(page, hash) {
  await page.goto(hash);
  await expect(page.locator('.detail h2')).toBeVisible();
  await page.locator('.detail .back').focus();
  await page.locator('.detail .fuente').evaluate((el) => el.scrollIntoView({ block: 'center' }));
}

async function ganarConoceRovers(page) {
  await sembrar(page, { leidas: leidas(PASOS.slice(0, 3)) });
  await leerConFoco(page, './#/concepto/dirigente-rovers?ruta=conoce-rovers&paso=4');
  const hoja = page.locator('.hoja-parche');
  await expect(hoja).toBeVisible();
  return hoja;
}

// Animaciones en curso dentro de un nodo (y sus descendientes).
const enCurso = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return -1;
  return el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length;
}, sel);

// Espera a que terminen las animaciones finitas (las del ambiente son infinitas).
const esperarAnimaciones = (page) => page.evaluate(() => Promise.all(
  document.getAnimations()
    .filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
    .map((a) => a.finished.catch(() => {})),
));

test('ganar un parche muestra la hoja y se cierra', async ({ page }) => {
  const hoja = await ganarConoceRovers(page);
  await expect(hoja).toHaveAttribute('role', 'dialog');
  await expect(hoja).toHaveAttribute('aria-modal', 'true');
  await expect(hoja.locator('[aria-live="polite"]')).toHaveCount(1);
  const titulo = hoja.locator('#' + (await hoja.getAttribute('aria-labelledby')));
  await expect(titulo).toHaveText('Conoce el Clan');
  // El foco entra a la hoja.
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('.hoja-parche')))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hoja-parche')).toHaveCount(0);
  // El foco vuelve a donde estaba en la página.
  await expect(page.locator('.detail .back')).toBeFocused();
});

test('la hoja se cierra con un toque y con su botón', async ({ page }) => {
  // Un toque en el instante en que aparece la hoja (antes de 400 ms) no la cierra.
  await page.addInitScript(() => {
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.classList && n.classList.contains('hoja-parche') && window.__toqueTemprano === undefined) {
          n.click();
          window.__toqueTemprano = n.isConnected && !n.classList.contains('saliendo');
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });
  const hoja = await ganarConoceRovers(page);
  expect(await page.evaluate(() => window.__toqueTemprano), 'el toque temprano no debe cerrar').toBe(true);
  const seguir = hoja.getByRole('button', { name: 'Seguir' });
  // El foco llega a «Seguir» cuando ya se ve.
  await expect(seguir).toBeFocused();
  expect(Number(await seguir.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
  await seguir.click();
  await expect(page.locator('.hoja-parche')).toHaveCount(0);
});

test('varios parches a la vez se muestran en fila, nunca apilados', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.locator('.layer-card').first()).toBeVisible();
  await page.evaluate(async () => {
    const m = await import('./assets/celebracion.js');
    const base = { criterio: {}, color: '#016937', texto: '#ffffff', simbolo: 'panal', forma: 'hexagono' };
    m.celebrarParche({ ...base, id: 'uno', titulo: 'Primer parche' }, { completo: false });
    m.celebrarParche({ ...base, id: 'dos', titulo: 'Segundo parche' }, { completo: true });
  });
  await expect(page.locator('.hoja-parche')).toHaveCount(1);
  await expect(page.locator('.hoja-parche h2')).toHaveText('Primer parche');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hoja-parche h2')).toHaveText('Segundo parche');
  await expect(page.locator('.hoja-parche')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.hoja-parche')).toHaveCount(0);
});

test('completar una capa sin ganar parche también se celebra', async ({ page, request }) => {
  const [conceptos, rutas, parches] = await Promise.all(
    ['conceptos', 'rutas', 'parches'].map((f) => request.get(`./data/${f}.json`).then((r) => r.json())),
  );
  const capa = 3;
  const ids = conceptos.filter((c) => c.capa === capa).map((c) => c.id);
  const ultimo = ids[ids.length - 1];
  const set = new Set(ids);
  // Los parches de ruta que quedarían completos se siembran ya ganados: esta lectura no gana ninguno.
  const yaGanados = {};
  for (const p of parches) {
    const r = p.criterio.ruta && rutas.find((x) => x.id === p.criterio.ruta);
    if (r && r.pasos.every((id) => set.has(id))) yaGanados[p.id] = '2026-10-01';
  }
  await page.addInitScript(() => {
    window.__parches = 0;
    document.addEventListener('ps:parche', () => window.__parches++);
  });
  await sembrar(page, { leidas: leidas(ids.filter((id) => id !== ultimo)), parches: yaGanados });
  await leerConFoco(page, `./#/concepto/${ultimo}`);
  const hoja = page.locator('.hoja-parche');
  await expect(hoja).toBeVisible();
  await expect(hoja).toContainText('Capa completa');
  await expect(hoja.locator('h2')).toContainText(`Capa ${capa}`);
  await expect(hoja).toHaveClass(/\bcompleto\b/);
  expect(await page.evaluate(() => window.__parches)).toBe(0);
});

test('movimiento reducido: sin chispas ni ambiente', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ganarConoceRovers(page);
  await page.waitForTimeout(900);
  await expect(page.locator('.hoja-parche')).toBeVisible();
  await expect(page.locator('.hoja-parche h2')).toHaveText('Conoce el Clan');
  expect(await page.locator('.chispa').count()).toBe(0);
  await page.keyboard.press('Escape');
  await page.goto('./#/');
  await expect(page.locator('.hero .escena')).toHaveCount(1);
  await page.waitForTimeout(300);
  expect(await enCurso(page, '.hero .escena')).toBe(0);
});

test('con movimiento: hay chispas y ambiente', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ganarConoceRovers(page);
  await expect.poll(() => page.locator('.chispa').count()).toBeGreaterThanOrEqual(20);
  expect(await page.locator('.chispa').count()).toBeLessThanOrEqual(40);
  // Las chispas se retiran solas al terminar.
  await expect(page.locator('.chispa')).toHaveCount(0, { timeout: 4000 });
  await page.keyboard.press('Escape');
  await page.goto('./#/');
  await expect(page.locator('.hero .escena')).toHaveCount(1);
  await expect.poll(() => enCurso(page, '.hero .escena')).toBeGreaterThan(0);
  // Pestaña oculta: el ambiente se pausa; visible otra vez: sigue.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => enCurso(page, '.hero .escena')).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => enCurso(page, '.hero .escena')).toBeGreaterThan(0);
  // Al salir de Inicio la escena se desmonta.
  await page.locator('.tabbar a[data-route="buscar"]').click();
  await expect(page.locator('#q-input')).toBeVisible();
  await expect(page.locator('.escena')).toHaveCount(0);
});

test('la flor de lis no se anima', async ({ page }) => {
  const revisar = async () => {
    const r = await page.evaluate(() => [...document.querySelectorAll('img.logo, [src$="icon.svg"]')].map((el) => ({
      animaciones: el.getAnimations().length,
      nombre: getComputedStyle(el).animationName,
    })));
    expect(r.length).toBeGreaterThan(0);
    for (const x of r) {
      expect(x.animaciones).toBe(0);
      expect(x.nombre).toBe('none');
    }
  };
  await ganarConoceRovers(page);
  await revisar();
  await page.keyboard.press('Escape');
  await page.goto('./#/');
  await expect(page.locator('.hero .escena')).toHaveCount(1);
  await revisar();
});

// Ficha leída → el anillo de su capa avanza en Inicio (desde el valor anterior).
// Un MutationObserver cuenta las «tapas» creadas: no depende de pillar la animación a mitad de vuelo.
async function leerYVolver(page) {
  await page.addInitScript(() => {
    window.__tapas = 0;
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches('.anillo-tapa') || n.querySelector('.anillo-tapa'))) window.__tapas++;
      }
    }).observe(document, { childList: true, subtree: true });
  });
  await sembrar(page, {});
  await page.goto('./#/concepto/proposito-del-movimiento');
  await expect(page.locator('.detail h2')).toBeVisible();
  await page.locator('.detail .fuente').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect(page.locator('.sello-visto')).toHaveCount(1);
  await page.locator('.tabbar a[data-route=""]').click();
  const anillo = page.locator('.layer-card[data-capa="0"] .anillo');
  await expect(anillo).toBeVisible();
  return anillo;
}
const tapasCreadas = (page) => page.evaluate(() => window.__tapas);

test('ficha leída: el anillo de la capa avanza en Inicio', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const anillo = await leerYVolver(page);
  expect(Number(await anillo.getAttribute('data-pct'))).toBeGreaterThan(0);
  await expect.poll(() => tapasCreadas(page)).toBeGreaterThan(0);
  const creadas = await tapasCreadas(page);
  // Sin avance nuevo, volver a Inicio no crea otra tapa (el contador no sube).
  await page.locator('.tabbar a[data-route="buscar"]').click();
  await page.locator('.tabbar a[data-route=""]').click();
  await expect(anillo).toBeVisible();
  await expect(page.locator('.anillo-tapa')).toHaveCount(0);
  expect(await tapasCreadas(page)).toBe(creadas);
});

test('movimiento reducido: el anillo queda en su valor final, sin animar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const anillo = await leerYVolver(page);
  expect(Number(await anillo.getAttribute('data-pct'))).toBeGreaterThan(0);
  await expect(page.locator('.anillo-tapa')).toHaveCount(0);
  expect(await tapasCreadas(page)).toBe(0);
});

test('al volver, la vista entra desde el lado contrario', async ({ page }) => {
  await page.goto('./#/');
  await expect(page.locator('.layer-card').first()).toBeVisible();
  await page.locator('.layer-card').first().click();
  await expect(page.locator('.view.capa')).toBeVisible();
  await expect(page.locator('.view')).not.toHaveClass(/\bentra-atras\b/);
  await page.goBack();
  await expect(page.locator('.view.inicio')).toBeVisible();
  await expect(page.locator('.view')).toHaveClass(/\bentra-atras\b/);
});

test.describe('@solo-escritorio accesibilidad de la hoja abierta', () => {
  for (const tema of ['light', 'dark']) {
    test(`a11y: hoja de parche [${tema}]`, async ({ page }) => {
      await page.addInitScript((t) => { try { localStorage.setItem('ps-theme', t); } catch (e) {} }, tema);
      await ganarConoceRovers(page);
      await esperarAnimaciones(page);
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
