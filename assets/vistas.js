/* Programa Scout — vistas (módulo ES). Cada vista recibe ctx y devuelve HTML.
   ctx = { db: {capas, conceptos, situaciones, rutas, parches}, byId, estado }
   Este módulo no importa app.js. */

/* ---------- utilidades ---------- */
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function draftChip(estado) {
  return estado === "auditado" ? "" : '<span class="chip draft">borrador</span>';
}

/* ---------- búsqueda ---------- */
export function buscar(ctx, q) {
  const n = norm(q).trim();
  if (!n) return { conceptos: [], situaciones: [] };
  const terms = n.split(/\s+/);
  const match = (text) => terms.every((t) => norm(text).includes(t));
  return {
    conceptos: ctx.db.conceptos.filter((c) => match(`${c.termino} ${c.definicion} ${c.enLaPractica}`)),
    situaciones: ctx.db.situaciones.filter((s) => match(`${s.titulo} ${s.caso} ${s.doctrina}`)),
  };
}

export function vistaInicio(ctx) {
  const layers = ctx.db.capas
    .map(
      (c) => `
      <button class="layer-card" onclick="go('#/capa/${c.id}')">
        <span class="lc-num">${c.nivel}</span>
        <span class="lc-body"><h3>${esc(c.titulo)}</h3><p>${esc(c.resumen)}</p></span>
      </button>`
    )
    .join("");

  const rutas = ctx.db.rutas
    .map(
      (r) => `
      <button class="card list-item" onclick="go('#/ruta/${r.id}')">
        <h3>🧭 ${esc(r.titulo)} ${draftChip(r.estado)}</h3>
        <p>${esc(r.descripcion)}</p>
      </button>`
    )
    .join("");

  return `
    <div class="view">
      <div class="search-wrap">
        <span class="si">🔍</span>
        <input type="search" placeholder="Buscar un concepto o situación…" oninput="go('#/buscar/' + encodeURIComponent(this.value))" />
      </div>
      <p class="section-title">Explorar por capas</p>
      <div class="layers">${layers}</div>
      <p class="section-title">Rutas guiadas</p>
      ${rutas || '<p class="empty">Aún no hay rutas.</p>'}
      <p class="install-hint">Para instalarla: abre el menú del navegador y elige «Agregar a pantalla de inicio».</p>
    </div>`;
}

export function vistaCapa(ctx, id) {
  const capa = ctx.db.capas.find((c) => c.id === id);
  if (!capa) return vistaNoEncontrada();
  const conceptos = ctx.db.conceptos.filter((c) => c.capa === capa.nivel);
  const items =
    conceptos
      .map(
        (c) => `
      <button class="card list-item" onclick="go('#/concepto/${c.id}')">
        <h3>${esc(c.termino)} ${draftChip(c.estado)}</h3>
        <p>${esc(c.definicion).slice(0, 110)}…</p>
      </button>`
      )
      .join("") || '<p class="empty">Esta capa aún no tiene conceptos cargados.</p>';
  return `
    <div class="view">
      <button class="back" onclick="go('#/')">← Inicio</button>
      <h2 class="detail">${esc(capa.titulo)}</h2>
      <p style="color:var(--muted);margin-top:0">${esc(capa.resumen)}</p>
      <p class="section-title">Conceptos</p>
      ${items}
    </div>`;
}

export function vistaConcepto(ctx, id) {
  const c = ctx.byId[id];
  if (!c) return vistaNoEncontrada();
  const cita =
    c.cita && (c.cita.texto || c.cita.fuente)
      ? `<div class="block"><div class="lbl">Fuente oficial</div>
          <div class="cite">${c.cita.texto ? `«${esc(c.cita.texto)}»` : "Cita textual pendiente de incorporar."}
          <div class="src">${esc(c.cita.fuente || "")}${c.cita.ubicacion ? " — " + esc(c.cita.ubicacion) : ""}</div></div></div>`
      : "";
  const rel = (c.relacionados || [])
    .map((rid) => (ctx.byId[rid] ? `<a onclick="go('#/concepto/${rid}')">${esc(ctx.byId[rid].termino)}</a>` : ""))
    .join("");
  return `
    <div class="view detail">
      <button class="back" onclick="history.length>1?history.back():go('#/')">← Volver</button>
      <h2>${esc(c.termino)} ${draftChip(c.estado)}</h2>
      <p class="def">${esc(c.definicion)}</p>
      <div class="block"><div class="lbl">En la práctica</div>
        <div class="practice">${esc(c.enLaPractica)}</div></div>
      ${cita}
      ${rel ? `<div class="block"><div class="lbl">Conceptos relacionados</div><div class="related">${rel}</div></div>` : ""}
    </div>`;
}

export function vistaSituacion(ctx, id) {
  const s = ctx.db.situaciones.find((x) => x.id === id);
  if (!s) return vistaNoEncontrada();
  const rel = (s.conceptos || [])
    .map((rid) => (ctx.byId[rid] ? `<a onclick="go('#/concepto/${rid}')">${esc(ctx.byId[rid].termino)}</a>` : ""))
    .join("");
  return `
    <div class="view detail">
      <button class="back" onclick="history.length>1?history.back():go('#/')">← Volver</button>
      <h2>${esc(s.titulo)} ${draftChip(s.estado)}</h2>
      <div class="block"><div class="lbl">La situación</div><p>${esc(s.caso)}</p></div>
      <div class="block"><div class="lbl">Qué dice la doctrina</div><div class="cite">${esc(s.doctrina)}
        ${s.fuente ? `<div class="src">${esc(s.fuente.fuente || "")}${s.fuente.ubicacion ? " — " + esc(s.fuente.ubicacion) : ""}</div>` : ""}</div></div>
      <div class="block"><div class="lbl">Cómo aplicarlo</div><div class="practice">${esc(s.aplicacion)}</div></div>
      ${rel ? `<div class="block"><div class="lbl">Conceptos en juego</div><div class="related">${rel}</div></div>` : ""}
    </div>`;
}

export function vistaRuta(ctx, id) {
  const r = ctx.db.rutas.find((x) => x.id === id);
  if (!r) return vistaNoEncontrada();
  const pasos = (r.pasos || [])
    .map((pid) => (ctx.byId[pid] ? `<a class="card" onclick="go('#/concepto/${pid}')">${esc(ctx.byId[pid].termino)}</a>` : ""))
    .join("");
  return `
    <div class="view detail">
      <button class="back" onclick="go('#/')">← Inicio</button>
      <h2>🧭 ${esc(r.titulo)} ${draftChip(r.estado)}</h2>
      <p style="color:var(--muted)">${esc(r.descripcion)}</p>
      <p class="section-title">Sigue la secuencia</p>
      <div class="route-steps">${pasos}</div>
    </div>`;
}

export function resultadosBusqueda(ctx, q) {
  const res = buscar(ctx, q);
  const cs = res.conceptos
    .map((c) => `<button class="card list-item" onclick="go('#/concepto/${c.id}')"><h3>${esc(c.termino)} ${draftChip(c.estado)}</h3><p>${esc(c.definicion).slice(0,100)}…</p></button>`)
    .join("");
  const ss = res.situaciones
    .map((s) => `<button class="card list-item" onclick="go('#/situacion/${s.id}')"><h3>💬 ${esc(s.titulo)}</h3></button>`)
    .join("");
  const total = res.conceptos.length + res.situaciones.length;
  if (!q) return '<p class="empty">Escribe para buscar conceptos y situaciones.</p>';
  if (total === 0) return '<p class="empty">Sin resultados. Prueba con otra palabra.</p>';
  return `${cs ? `<p class="section-title">Conceptos</p>${cs}` : ""}${ss ? `<p class="section-title">Situaciones</p>${ss}` : ""}`;
}

export function vistaBuscar(ctx, q) {
  return `
    <div class="view">
      <div class="search-wrap">
        <span class="si">🔍</span>
        <input id="q-input" type="search" value="${esc(q)}" placeholder="Buscar…" oninput="runSearch(this.value)" />
      </div>
      <div id="search-results">${resultadosBusqueda(ctx, q)}</div>
    </div>`;
}

export function vistaSituaciones(ctx) {
  const items = ctx.db.situaciones
    .map((s) => `<button class="card list-item" onclick="go('#/situacion/${s.id}')"><h3>💬 ${esc(s.titulo)} ${draftChip(s.estado)}</h3><p>${esc(s.caso).slice(0,110)}…</p></button>`)
    .join("") || '<p class="empty">Aún no hay situaciones cargadas.</p>';
  return `<div class="view"><h2 class="detail">Situaciones reales</h2><p style="color:var(--muted);margin-top:0">Casos concretos resueltos con doctrina.</p>${items}</div>`;
}

export function vistaNoEncontrada() {
  return '<div class="view"><p class="empty">No encontramos eso.<br><button class="back" onclick="go(\'#/\')">← Inicio</button></p></div>';
}
