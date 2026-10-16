/* Programa Scout — vistas (módulo ES). Cada vista recibe ctx y devuelve HTML.
   ctx = { db: {capas, conceptos, situaciones, rutas, parches}, byId, estado }
   Este módulo no importa app.js. */

/* ---------- utilidades ---------- */
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/* Ícono del sprite en línea de index.html (decorativo: el texto vecino lo nombra). */
export function icono(nombre) {
  return `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${nombre}"/></svg>`;
}

/* Símbolo de cada capa (spec §2.1) y nombre visible de cada rama con su unidad. */
const ICONO_CAPA = ["brujula", "libro", "panal", "nudo"];
const RAMAS = {
  cachorros: { nombre: "Cachorros", unidad: "Familia" },
  lobatos: { nombre: "Lobatos", unidad: "Manada" },
  scouts: { nombre: "Scouts", unidad: "Tropa" },
  "nomadas-scout": { nombre: "Nómadas Scout", unidad: "Comunidad" },
  rovers: { nombre: "Rovers", unidad: "Clan" },
};

/* Atributos de tinte para la raíz de una vista o tarjeta. */
function tinte(capa, rama) {
  return `data-capa="${Number(capa) || 0}"${rama && RAMAS[rama] ? ` data-rama="${esc(rama)}"` : ""}`;
}

/* Etiqueta de bloque con su ícono en insignia redonda. */
const etiqueta = (nombre, texto) => `<h3 class="lbl"><span class="ico-b">${icono(nombre)}</span>${texto}</h3>`;

const volver = () => `<button class="back" onclick="history.length>1?history.back():go('#/')">${icono("flecha")} Volver</button>`;

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
      <button class="layer-card" ${tinte(c.nivel)} onclick="go('#/capa/${c.id}')">
        <span class="lc-num">${icono(ICONO_CAPA[c.nivel] || "brujula")}</span>
        <span class="lc-body"><span class="lc-eyebrow">Capa ${c.nivel}</span><h3>${esc(c.titulo)}</h3><p>${esc(c.resumen)}</p></span>
      </button>`
    )
    .join("");

  const rutas = ctx.db.rutas
    .map(
      (r) => `
      <button class="card list-item" onclick="go('#/ruta/${r.id}')">
        <h3>${icono("mapa")} ${esc(r.titulo)} ${draftChip(r.estado)}</h3>
        <p>${esc(r.descripcion)}</p>
      </button>`
    )
    .join("");

  return `
    <div class="view">
      <div class="search-wrap">
        <span class="si">${icono("lupa")}</span>
        <input type="search" aria-label="Buscar" placeholder="Buscar un concepto o situación…" oninput="go('#/buscar/' + encodeURIComponent(this.value))" />
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
      <button class="card list-item" ${tinte(c.capa, c.rama)} onclick="go('#/concepto/${c.id}')">
        <h3>${esc(c.termino)} ${draftChip(c.estado)}</h3>
        <p>${esc(c.definicion).slice(0, 110)}…</p>
      </button>`
      )
      .join("") || '<p class="empty">Esta capa aún no tiene conceptos cargados.</p>';
  return `
    <div class="view" ${tinte(capa.nivel)}>
      <button class="back" onclick="go('#/')">${icono("flecha")} Inicio</button>
      <h2 class="titulo-vista">${esc(capa.titulo)}</h2>
      <p class="bajada">${esc(capa.resumen)}</p>
      <p class="section-title">Conceptos</p>
      ${items}
    </div>`;
}

export function vistaConcepto(ctx, id) {
  const c = ctx.byId[id];
  if (!c) return vistaNoEncontrada();
  const capa = ctx.db.capas.find((k) => k.nivel === c.capa);
  const rama = RAMAS[c.rama];
  const ico = ICONO_CAPA[c.capa] || "brujula";
  const cinta = `
      <div class="cinta">
        <span class="cinta-ico">${icono(ico)}</span>
        <span class="cinta-txt">
          <span class="cinta-eyebrow">Capa ${c.capa}${capa ? " · " + esc(capa.titulo) : ""}</span>
          ${rama ? `<span class="chip">${esc(rama.nombre)} · ${esc(rama.unidad)}</span>` : ""}
        </span>
        <svg class="cinta-fondo" aria-hidden="true" focusable="false"><use href="#i-${ico}"/></svg>
      </div>`;
  const cita = c.cita || {};
  const fuente = `
      <section class="fuente">
        ${etiqueta("libro", "Fuente oficial")}
        ${cita.texto ? `<p class="cite">${esc(cita.texto)}</p>` : '<p class="cite sin-texto">Cita textual pendiente de incorporar.</p>'}
        ${cita.fuente || cita.ubicacion ? `<p class="src"><strong>${esc(cita.fuente || "")}</strong>${cita.ubicacion ? `<span>${esc(cita.ubicacion)}</span>` : ""}</p>` : ""}
      </section>`;
  const rel = (c.relacionados || [])
    .map((rid) => (ctx.byId[rid] ? `<a href="#/concepto/${rid}">${esc(ctx.byId[rid].termino)} ${icono("flecha")}</a>` : ""))
    .join("");
  // Orden fijo: la fuente oficial es siempre el último hijo de .detail.
  return `
    <article class="view detail ficha" ${tinte(c.capa, c.rama)}>
      ${volver()}
      ${cinta}
      <h2>${esc(c.termino)} ${draftChip(c.estado)}</h2>
      <p class="def">${esc(c.definicion)}</p>
      <section class="block practica practice">
        ${etiqueta("carpa", "En la práctica")}
        <p>${esc(c.enLaPractica)}</p>
      </section>
      ${rel ? `<section class="block">${etiqueta("huella", "Conceptos relacionados")}<div class="related">${rel}</div></section>` : ""}
      ${fuente}
    </article>`;
}

export function vistaSituacion(ctx, id) {
  const s = ctx.db.situaciones.find((x) => x.id === id);
  if (!s) return vistaNoEncontrada();
  const rel = (s.conceptos || [])
    .map((rid) => (ctx.byId[rid] ? `<a href="#/concepto/${rid}">${esc(ctx.byId[rid].termino)} ${icono("flecha")}</a>` : ""))
    .join("");
  const f = s.fuente || {};
  // Tarjeta de diálogo: el caso pregunta, la doctrina responde con su fuente.
  return `
    <article class="view detail situacion" data-capa="3">
      ${volver()}
      <div class="cinta">
        <span class="cinta-ico">${icono("dialogo")}</span>
        <span class="cinta-txt">
          <span class="cinta-eyebrow">Capa 3 · Situación real</span>
          <span class="chip">Caso y doctrina</span>
        </span>
        <svg class="cinta-fondo" aria-hidden="true" focusable="false"><use href="#i-dialogo"/></svg>
      </div>
      <h2>${esc(s.titulo)} ${draftChip(s.estado)}</h2>
      <div class="dialogo">
        <section class="block globo globo-caso">
          ${etiqueta("dialogo", "La situación")}
          <p>${esc(s.caso)}</p>
        </section>
        <section class="block globo globo-doctrina">
          ${etiqueta("libro", "Qué dice la doctrina")}
          <p class="cite">${esc(s.doctrina)}</p>
          ${f.fuente || f.ubicacion ? `<p class="src"><strong>${esc(f.fuente || "")}</strong>${f.ubicacion ? `<span>${esc(f.ubicacion)}</span>` : ""}</p>` : ""}
        </section>
      </div>
      <section class="block practica practice">
        ${etiqueta("nudo", "Cómo aplicarlo")}
        <p>${esc(s.aplicacion)}</p>
      </section>
      ${rel ? `<section class="block">${etiqueta("huella", "Conceptos en juego")}<div class="related">${rel}</div></section>` : ""}
    </article>`;
}

export function vistaRuta(ctx, id) {
  const r = ctx.db.rutas.find((x) => x.id === id);
  if (!r) return vistaNoEncontrada();
  const pasos = (r.pasos || [])
    .map((pid) => (ctx.byId[pid] ? `<a class="card" onclick="go('#/concepto/${pid}')">${esc(ctx.byId[pid].termino)}</a>` : ""))
    .join("");
  return `
    <div class="view detail">
      <button class="back" onclick="go('#/')">${icono("flecha")} Inicio</button>
      <h2>${esc(r.titulo)} ${draftChip(r.estado)}</h2>
      <p class="bajada">${esc(r.descripcion)}</p>
      <p class="section-title">Sigue la secuencia</p>
      <div class="route-steps">${pasos}</div>
    </div>`;
}

export function resultadosBusqueda(ctx, q) {
  const res = buscar(ctx, q);
  const cs = res.conceptos
    .map((c) => `<button class="card list-item" ${tinte(c.capa, c.rama)} onclick="go('#/concepto/${c.id}')"><h3>${esc(c.termino)} ${draftChip(c.estado)}</h3><p>${esc(c.definicion).slice(0,100)}…</p></button>`)
    .join("");
  const ss = res.situaciones
    .map((s) => `<button class="card list-item" data-capa="3" onclick="go('#/situacion/${s.id}')"><h3>${icono("dialogo")} ${esc(s.titulo)}</h3></button>`)
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
        <span class="si">${icono("lupa")}</span>
        <input id="q-input" type="search" aria-label="Buscar" value="${esc(q)}" placeholder="Buscar…" oninput="runSearch(this.value)" />
      </div>
      <div id="search-results">${resultadosBusqueda(ctx, q)}</div>
    </div>`;
}

export function vistaSituaciones(ctx) {
  const items = ctx.db.situaciones
    .map((s) => `<button class="card list-item" data-capa="3" onclick="go('#/situacion/${s.id}')"><h3>${icono("dialogo")} ${esc(s.titulo)} ${draftChip(s.estado)}</h3><p>${esc(s.caso).slice(0,110)}…</p></button>`)
    .join("") || '<p class="empty">Aún no hay situaciones cargadas.</p>';
  return `<div class="view"><h2 class="titulo-vista">Situaciones reales</h2><p class="bajada">Casos concretos resueltos con doctrina.</p>${items}</div>`;
}

export function vistaNoEncontrada() {
  return `<div class="view"><p class="empty">No encontramos eso.<br><button class="back" onclick="go('#/')">${icono("flecha")} Inicio</button></p></div>`;
}
