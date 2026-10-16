// Accesibilidad con axe-core — WCAG 2.0/2.1 nivel A y AA.
// Recorre las vistas clave en tema claro y oscuro. Solo escritorio.
const { test, expect } = require('./_base');
const AxeBuilder = require('@axe-core/playwright').default;

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const IMPACTOS = new Set(['serious', 'critical']);

const VISTAS = [
  { nombre: 'home', hash: './#/' },
  { nombre: 'capa', hash: './#/capa/transversal' },
  { nombre: 'concepto', hash: './#/concepto/metodo-scout' },
  { nombre: 'buscar', hash: './#/buscar/educa' },
  { nombre: 'concepto-rama', hash: './#/concepto/manada-lobatos' },
  { nombre: 'situacion', hash: './#/situacion/actividades-sin-rumbo' },
  { nombre: 'capa-ramas', hash: './#/capa/ramas' },
  { nombre: 'ruta', hash: './#/ruta/conoce-rovers' },
  { nombre: 'mochila', hash: './#/mochila' },
];

async function auditar(page, hash, tema, esperaSel) {
  // La app lee localStorage['ps-theme'] al iniciar.
  await page.addInitScript((t) => {
    try { localStorage.setItem('ps-theme', t); } catch (e) {}
  }, tema);
  await page.goto(hash, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(esperaSel);
  // Medir el contraste en reposo: a mitad de un fundido (entrada, cascada) axe ve
  // colores a medio camino. Las animaciones del ambiente son infinitas: no se esperan.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Infinity)
    .map((a) => a.finished.catch(() => {}))));
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const graves = r.violations.filter((v) => IMPACTOS.has(v.impact));
  const resumen = graves
    .map((v) => `[${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} nodo/s)`)
    .join('\n');
  return { graves, resumen };
}

const ESPERA = {
  home: '.layer-card',
  capa: '.list-item',
  concepto: '.detail h2',
  buscar: '#q-input',
  'concepto-rama': '.detail h2',
  situacion: '.detail h2',
  'capa-ramas': '.panal .hex-rama',
  ruta: '.sendero .paso',
  mochila: '.parche',
};

test.describe('@solo-escritorio accesibilidad', () => {
  for (const vista of VISTAS) {
    for (const tema of ['light', 'dark']) {
      test(`a11y: ${vista.nombre} [${tema}]`, async ({ page }, testInfo) => {
        const { graves, resumen } = await auditar(page, vista.hash, tema, ESPERA[vista.nombre]);
        if (graves.length) testInfo.annotations.push({ type: 'a11y', description: resumen });
        expect(graves, `violaciones serious/critical:\n${resumen}`).toEqual([]);
      });
    }
  }
});
