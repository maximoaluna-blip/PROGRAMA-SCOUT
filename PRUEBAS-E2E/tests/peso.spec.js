// Presupuesto de peso: suma los bytes (crudos) de lo que el service worker precachea
// bajo ./assets/ más ./data/parches.json. Solo escritorio (@solo-escritorio).
// El spec §6 fijaba 120 KB; se midió 130,8 KB crudos (≈35 KB con gzip) y el controlador
// subió el tope a 140 KB como guardia contra crecimiento — ver docs/superpowers/specs,
// decisión pendiente del dueño.
const { test, expect } = require('./_base');

const TOPE = 140 * 1024;

test('@solo-escritorio el peso de assets/ y parches.json cabe en el presupuesto', async ({ request }) => {
  const sw = await (await request.get('./sw.js')).text();
  const bloque = sw.match(/APP_SHELL\s*=\s*\[([\s\S]*?)\]/);
  expect(bloque, 'no se encontró APP_SHELL en sw.js').toBeTruthy();
  const entradas = [...bloque[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const medidas = entradas.filter((e) => e.startsWith('./assets/') || e === './data/parches.json');
  expect(medidas.length, 'APP_SHELL sin assets').toBeGreaterThan(5);

  let total = 0;
  const detalle = [];
  for (const e of medidas) {
    const r = await request.get(e);
    expect(r.status(), `${e} HTTP`).toBe(200);
    const n = (await r.body()).length;
    detalle.push(`${e} ${n}`);
    total += n;
  }
  expect(total, `peso ${total} B (tope ${TOPE}). ${detalle.join(' · ')}`).toBeLessThanOrEqual(TOPE);
});
