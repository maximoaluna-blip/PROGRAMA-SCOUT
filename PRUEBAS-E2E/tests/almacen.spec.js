// Almacén del progreso: persistencia en localStorage con respaldo en memoria.
const { test, expect } = require('./_base');


test('guarda y lee el estado', async ({ page }) => {
  await page.goto('./');
  const r = await page.evaluate(async () => {
    const m = await import('./assets/almacen.js');
    const ok = m.guardar({ ...m.estadoInicial(), leidas: { a: '2026-10-16' } });
    return { ok, a: m.leer().leidas.a };
  });
  expect(r.ok).toBe(true);
  expect(r.a).toBe('2026-10-16');
});

test('JSON corrupto arranca de cero', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ps-progreso-v1', '{no json'));
  await page.goto('./');
  const r = await page.evaluate(async () => {
    const m = await import('./assets/almacen.js');
    return { leido: m.leer(), inicial: m.estadoInicial() };
  });
  expect(r.leido).toEqual(r.inicial);
});

test('estado parcial se completa', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ps-progreso-v1', '{"leidas":{"a":"x"}}'));
  await page.goto('./');
  const r = await page.evaluate(async () => {
    const m = await import('./assets/almacen.js');
    const e = m.leer();
    return { parches: e.parches, a: e.leidas.a, ultima: e.ultima };
  });
  expect(r.parches).toEqual({});
  expect(r.a).toBe('x');
  expect(r.ultima).toBeNull();
});

test('almacenamiento bloqueado', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('QuotaExceeded'); };
  });
  await page.goto('./');
  const r = await page.evaluate(async () => {
    const m = await import('./assets/almacen.js');
    const ok = m.guardar({ ...m.estadoInicial(), leidas: { z: 'mem' } });
    return { ok, disp: m.disponible(), z: m.leer().leidas.z };
  });
  expect(r.ok).toBe(false);
  expect(r.disp).toBe(false);
  expect(r.z).toBe('mem');
});

test('reiniciar borra solo su clave', async ({ page }) => {
  await page.goto('./');
  const r = await page.evaluate(async () => {
    localStorage.setItem('ps-theme', 'dark');
    const m = await import('./assets/almacen.js');
    const previa = localStorage.getItem('ps-progreso-v1') !== null;
    const nuevo = m.reiniciar();
    return {
      previa, nuevo, inicial: m.estadoInicial(),
      tema: localStorage.getItem('ps-theme'),
      progreso: localStorage.getItem('ps-progreso-v1'),
    };
  });
  expect(r.previa).toBe(true);
  expect(r.nuevo).toEqual(r.inicial);
  expect(r.tema).toBe('dark');
  expect(r.progreso).toBeNull();
});
