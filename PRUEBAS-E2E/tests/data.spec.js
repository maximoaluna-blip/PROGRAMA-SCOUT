// Integridad del contenido curado (fuente de verdad en /data).
// No necesita navegador: lee los JSON del repo. Solo escritorio (@solo-escritorio).
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', '..', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const conceptos = read('conceptos.json');
const capas = read('capas.json');
const rutas = read('rutas.json');
const situaciones = read('situaciones.json');
const ids = new Set(conceptos.map((c) => c.id));

test.describe('@solo-escritorio integridad de datos', () => {
  test('los 4 JSON son arreglos no vacíos', () => {
    for (const [n, arr] of Object.entries({ conceptos, capas, rutas, situaciones })) {
      expect(Array.isArray(arr), `${n} debe ser arreglo`).toBeTruthy();
      expect(arr.length, `${n} no debe estar vacío`).toBeGreaterThan(0);
    }
  });

  test('no hay IDs de concepto duplicados', () => {
    const vistos = new Set();
    const dups = [];
    for (const c of conceptos) {
      if (vistos.has(c.id)) dups.push(c.id);
      vistos.add(c.id);
    }
    expect(dups, `IDs duplicados: ${dups.join(', ')}`).toEqual([]);
  });

  test('todo concepto tiene campos mínimos', () => {
    const malos = conceptos
      .filter((c) => !c.id || !c.termino || !c.definicion || !c.enLaPractica || typeof c.capa !== 'number')
      .map((c) => c.id || '(sin id)');
    expect(malos, `conceptos incompletos: ${malos.join(', ')}`).toEqual([]);
  });

  test('los enlaces "relacionados" apuntan a conceptos existentes', () => {
    const rotos = [];
    for (const c of conceptos) {
      for (const r of c.relacionados || []) {
        if (!ids.has(r)) rotos.push(`${c.id} -> ${r}`);
      }
    }
    expect(rotos, `relacionados rotos: ${rotos.join(', ')}`).toEqual([]);
  });

  test('los pasos de las rutas apuntan a conceptos existentes', () => {
    const rotos = [];
    for (const rt of rutas) {
      for (const p of rt.pasos || []) {
        if (!ids.has(p)) rotos.push(`${rt.id} -> ${p}`);
      }
    }
    expect(rotos, `pasos de ruta rotos: ${rotos.join(', ')}`).toEqual([]);
  });

  test('los conceptos referidos por situaciones existen', () => {
    const rotos = [];
    for (const s of situaciones) {
      for (const p of s.conceptos || []) {
        if (!ids.has(p)) rotos.push(`${s.id} -> ${p}`);
      }
    }
    expect(rotos, `situaciones con concepto inexistente: ${rotos.join(', ')}`).toEqual([]);
  });

  test('todo concepto AUDITADO tiene cita textual con fuente y ubicación', () => {
    const malos = conceptos
      .filter((c) => c.estado === 'auditado')
      .filter((c) => !c.cita || !c.cita.texto || !c.cita.fuente || !c.cita.ubicacion ||
        /por verificar|por desarrollar/i.test(c.cita.ubicacion))
      .map((c) => c.id);
    expect(malos, `auditados sin cita completa: ${malos.join(', ')}`).toEqual([]);
  });

  test('la capa de cada concepto existe en capas.json', () => {
    const niveles = new Set(capas.map((c) => c.nivel));
    const malos = conceptos.filter((c) => !niveles.has(c.capa)).map((c) => `${c.id} (capa ${c.capa})`);
    expect(malos, `conceptos con capa inexistente: ${malos.join(', ')}`).toEqual([]);
  });
});
