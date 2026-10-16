// Progreso: lógica pura (sin DOM). Cada función devuelve estado nuevo y nunca muta la entrada.
// Forma del estado (ver almacen.js): { leidas, situaciones, parches, ultima, sonido, bienvenida }.

const campo = (tipo) => (tipo === 'situacion' ? 'situaciones' : 'leidas');

/** Marca una ficha o situación como leída. Si ya lo estaba, conserva la fecha original. */
export function marcarLeida(estado, tipo, id, fecha) {
  const c = campo(tipo);
  if (estado[c] && estado[c][id]) return { estado, nueva: false };
  return { estado: { ...estado, [c]: { ...estado[c], [id]: fecha } }, nueva: true };
}

/** Tipo de ítem que cuenta un parche: 'situacion' o 'concepto'. */
export function tipoDeCriterio(parche) {
  return parche.criterio.situaciones ? 'situacion' : 'concepto';
}

/** Ids que debe leer el usuario para ganar el parche. */
export function idsDeCriterio(parche, db) {
  const c = parche.criterio;
  if (c.ruta) {
    const ruta = db.rutas.find((r) => r.id === c.ruta);
    return ruta ? [...ruta.pasos] : [];
  }
  if (c.situaciones === 'todas') return db.situaciones.map((s) => s.id);
  if (c.conceptos === 'todos') return db.conceptos.map((x) => x.id);
  return [];
}

/** Cuántos de `ids` están leídos. */
export function avance(estado, ids, tipo) {
  const leidas = estado[campo(tipo)] || {};
  return { leidas: ids.filter((id) => leidas[id]).length, total: ids.length };
}

export function avanceCapa(estado, db, capa) {
  return avance(estado, db.conceptos.filter((c) => c.capa === capa).map((c) => c.id), 'concepto');
}

export function avanceRama(estado, db, rama) {
  return avance(estado, db.conceptos.filter((c) => c.rama === rama).map((c) => c.id), 'concepto');
}

const completo = (estado, parche, db) => {
  const a = avance(estado, idsDeCriterio(parche, db), tipoDeCriterio(parche));
  return a.total > 0 && a.leidas === a.total;
};

/** Gana los parches completos que aún no se tenían; los ya ganados no se tocan. */
export function ganarParches(estado, db, fecha) {
  const nuevos = db.parches.filter((p) => !(estado.parches || {})[p.id] && completo(estado, p, db));
  if (!nuevos.length) return { estado, nuevos };
  const parches = { ...estado.parches };
  nuevos.forEach((p) => { parches[p.id] = fecha; });
  return { estado: { ...estado, parches }, nuevos };
}

/** Parche ganado cuya ruta ahora tiene más pasos sin leer. */
export function rutaCrecio(estado, db, rutaId) {
  if (!(estado.parches || {})[rutaId]) return false;
  const p = db.parches.find((x) => x.id === rutaId);
  if (!p) return false;
  const a = avance(estado, idsDeCriterio(p, db), tipoDeCriterio(p));
  return a.leidas < a.total;
}

/** Ficha del día: determinista por fecha (YYYY-MM-DD) sobre las fichas auditadas. */
export function fichaDelDia(conceptos, fecha) {
  const lista = conceptos.filter((c) => c.estado === 'auditado');
  let h = 0;
  for (const c of fecha) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return lista[h % lista.length];
}
