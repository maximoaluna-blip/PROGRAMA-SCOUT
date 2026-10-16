// Lógica pura del progreso (assets/progreso.js): sin DOM, sin mutar la entrada.
const { test, expect } = require('./_base');

// Carga el módulo y los datos en el navegador y ejecuta `fn(m, db)`.
async function enPagina(page, fn) {
  await page.goto('./');
  return page.evaluate(async (src) => {
    const m = await import('./assets/progreso.js');
    const al = await import('./assets/almacen.js');
    const j = (f) => fetch(`./data/${f}.json`).then((r) => r.json());
    const db = {
      conceptos: await j('conceptos'), situaciones: await j('situaciones'),
      rutas: await j('rutas'), parches: await j('parches'),
    };
    // eslint-disable-next-line no-new-func
    return new Function('m', 'db', 'al', `return (${src})(m, db, al);`)(m, db, al);
  }, fn.toString());
}

test('marcar dos veces no cambia la fecha', async ({ page }) => {
  const r = await enPagina(page, (m, db, al) => {
    const a = m.marcarLeida(al.estadoInicial(), 'concepto', 'x', '2026-10-16');
    const b = m.marcarLeida(a.estado, 'concepto', 'x', '2026-10-20');
    return { n1: a.nueva, n2: b.nueva, f: b.estado.leidas.x };
  });
  expect(r).toEqual({ n1: true, n2: false, f: '2026-10-16' });
});

test('completar una ruta gana su parche una sola vez', async ({ page }) => {
  const r = await enPagina(page, (m, db, al) => {
    let e = al.estadoInicial();
    const ruta = db.rutas.find((x) => x.id === 'conoce-rovers');
    ruta.pasos.forEach((id) => { e = m.marcarLeida(e, 'concepto', id, '2026-10-16').estado; });
    const a = m.ganarParches(e, db, '2026-10-16');
    const b = m.ganarParches(a.estado, db, '2026-10-17');
    return { ids: a.nuevos.map((p) => p.id), n2: b.nuevos.length, fecha: b.estado.parches['conoce-rovers'] };
  });
  expect(r.ids).toEqual(['conoce-rovers']);
  expect(r.n2).toBe(0);
  expect(r.fecha).toBe('2026-10-16');
});

test('el parche sobrevive si la ruta crece', async ({ page }) => {
  const r = await enPagina(page, (m, db, al) => {
    let e = al.estadoInicial();
    db.rutas.find((x) => x.id === 'conoce-rovers').pasos.forEach((id) => {
      e = m.marcarLeida(e, 'concepto', id, '2026-10-16').estado;
    });
    e = m.ganarParches(e, db, '2026-10-16').estado;
    const db2 = JSON.parse(JSON.stringify(db));
    const extra = db2.conceptos.find((c) => !db2.rutas.find((x) => x.id === 'conoce-rovers').pasos.includes(c.id)).id;
    db2.rutas.find((x) => x.id === 'conoce-rovers').pasos.push(extra);
    const g = m.ganarParches(e, db2, '2026-10-18');
    return {
      sigue: g.estado.parches['conoce-rovers'], crecio: m.rutaCrecio(e, db2, 'conoce-rovers'),
      noCrecio: m.rutaCrecio(e, db, 'conoce-rovers'),
    };
  });
  expect(r).toEqual({ sigue: '2026-10-16', crecio: true, noCrecio: false });
});

test('situaciones y bitácora', async ({ page }) => {
  const r = await enPagina(page, (m, db, al) => {
    let e = al.estadoInicial();
    db.situaciones.forEach((s) => { e = m.marcarLeida(e, 'situacion', s.id, '2026-10-16').estado; });
    const a = m.ganarParches(e, db, '2026-10-16');
    db.conceptos.forEach((c) => { e = m.marcarLeida(a.estado, 'concepto', c.id, '2026-10-16').estado; a.estado = e; });
    const b = m.ganarParches(e, db, '2026-10-16');
    return {
      a: a.nuevos.map((p) => p.id), b: b.nuevos.map((p) => p.id),
      total: Object.keys(b.estado.parches).length, nc: db.conceptos.length, ns: db.situaciones.length,
    };
  });
  expect(r.ns).toBe(7);
  expect(r.nc).toBe(77);
  expect(r.a).toEqual(['lector-de-situaciones']);
  expect(r.b).toContain('bitacora-completa');
  expect(r.b.length).toBe(12);
  expect(r.total).toBe(13);
});

test('avance por capa y por rama', async ({ page }) => {
  const r = await enPagina(page, (m, db, al) => {
    const e = m.marcarLeida(al.estadoInicial(), 'concepto', db.conceptos.find((c) => c.rama === 'rovers').id, '2026-10-16').estado;
    const capa = db.conceptos.find((c) => c.rama === 'rovers').capa;
    return {
      rama: m.avanceRama(e, db, 'rovers'), capa: m.avanceCapa(e, db, capa),
      totalRama: db.conceptos.filter((c) => c.rama === 'rovers').length,
    };
  });
  expect(r.rama.leidas).toBe(1);
  expect(r.rama.total).toBe(r.totalRama);
  expect(r.capa.leidas).toBe(1);
});

test('ficha del día es estable', async ({ page }) => {
  const r = await enPagina(page, (m, db) => {
    const a = m.fichaDelDia(db.conceptos, '2026-10-16');
    const b = m.fichaDelDia(db.conceptos, '2026-10-16');
    return { a: a.id, b: b.id, estado: a.estado };
  });
  expect(r.a).toBe(r.b);
  expect(r.estado).toBe('auditado');
});

test('no muta la entrada', async ({ page }) => {
  const r = await enPagina(page, (m, db, al) => {
    const congelar = (o) => { Object.values(o).forEach((v) => { if (v && typeof v === 'object') congelar(v); }); return Object.freeze(o); };
    let e = al.estadoInicial();
    db.rutas.find((x) => x.id === 'conoce-rovers').pasos.forEach((id) => {
      e = m.marcarLeida(e, 'concepto', id, '2026-10-16').estado;
    });
    congelar(e); congelar(db);
    try {
      m.marcarLeida(e, 'situacion', db.situaciones[0].id, '2026-10-16');
      m.ganarParches(e, db, '2026-10-16');
      m.avance(e, ['a'], 'concepto'); m.avanceCapa(e, db, 0); m.avanceRama(e, db, 'rovers');
      m.rutaCrecio(e, db, 'conoce-rovers'); m.fichaDelDia(db.conceptos, '2026-10-16');
      m.idsDeCriterio(db.parches[0], db); m.tipoDeCriterio(db.parches[0]);
      return 'ok';
    } catch (err) { return String(err); }
  });
  expect(r).toBe('ok');
});
