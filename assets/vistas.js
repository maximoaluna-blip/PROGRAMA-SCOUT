/* Programa Scout — vistas (módulo ES). Cada vista recibe ctx y devuelve HTML.
   ctx = { db: {capas, conceptos, situaciones, rutas, parches}, byId, estado }
   Este módulo no importa app.js. */
import {
  avance, avanceCapa, avanceRama, fichaDelDia, rutaCrecio, idsDeCriterio, tipoDeCriterio,
} from "./progreso.js";


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

/* ---------- avance (solo lectura; marcar fichas llega en la Task 6) ---------- */
const pct = (a) => (a.total ? Math.round((a.leidas * 100) / a.total) : 0);
const leida = (ctx, id) => Boolean(((ctx.estado || {}).leidas || {})[id]);
const COLOR = /^#[0-9a-f]{3,8}$/i;

/* YYYY-MM-DD local y DD/MM/YYYY para el texto. */
export function hoyISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function fechaTexto(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}
export function saludo(hora) {
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

/* Recorta en el último espacio antes de `n` caracteres (sobre el texto sin escapar). */
function recorte(t, n) {
  const s = String(t ?? "");
  if (s.length <= n) return s;
  const corte = s.lastIndexOf(" ", n);
  return s.slice(0, corte > n * 0.6 ? corte : n).replace(/[\s,;:.]+$/, "") + "…";
}

/* Barra de avance: el relleno escala en X (listo para animar con transform). */
function pista(a, clase, etiquetaAria) {
  return `<span class="${clase}" role="progressbar" aria-label="${esc(etiquetaAria)}" aria-valuemin="0" aria-valuemax="${a.total}" aria-valuenow="${a.leidas}" aria-valuetext="${a.leidas} de ${a.total}"><span class="relleno" style="--p:${pct(a) / 100}"></span></span>`;
}

/* Anillo de avance alrededor del símbolo de la capa. */
function anillo(a, ico) {
  const p = pct(a);
  return `<span class="anillo" data-pct="${p}">
          <svg class="anillo-svg" viewBox="0 0 56 56" aria-hidden="true" focusable="false">
            <circle class="anillo-pista" cx="28" cy="28" r="25" pathLength="100"/>
            <circle class="anillo-avance" cx="28" cy="28" r="25" pathLength="100" stroke-dasharray="${p} 100"/>
          </svg>
          <span class="anillo-ico">${icono(ico)}</span>
        </span>`;
}

/* Paso de la ruta: `paso` es el número desde 1 (el mismo de `?paso=n` en el hash). */
function idDelPaso(ruta, paso) {
  return Number.isInteger(paso) ? (ruta.pasos || [])[paso - 1] : undefined;
}

/* Tinte de una ruta: la rama si todos sus pasos son de una sola; si no, la capa más frecuente. */
function tinteDeRuta(conceptos) {
  if (!conceptos.length) return tinte(0);
  const ramas = new Set(conceptos.map((c) => c.rama || ""));
  const cuenta = {};
  conceptos.forEach((c) => { cuenta[c.capa] = (cuenta[c.capa] || 0) + 1; });
  const capa = Object.keys(cuenta).sort((x, y) => cuenta[y] - cuenta[x])[0];
  return tinte(capa, ramas.size === 1 ? [...ramas][0] : null);
}

/* Parche bordado en SVG: fondo, borde y puntada interior; hexágono o círculo. */
function formaParche(p) {
  const hex = p.forma === "hexagono";
  const fondo = hex
    ? '<polygon class="pf-fondo" points="54,3 98.2,28.5 98.2,79.5 54,105 9.8,79.5 9.8,28.5"/>'
    : '<circle class="pf-fondo" cx="54" cy="54" r="51"/>';
  const puntada = hex
    ? '<polygon class="pf-puntada" points="54,12 90.4,33 90.4,75 54,96 17.6,75 17.6,33"/>'
    : '<circle class="pf-puntada" cx="54" cy="54" r="42"/>';
  return `<svg class="pf" viewBox="0 0 108 108" aria-hidden="true" focusable="false">${fondo}${puntada}<use class="pf-simbolo" href="#i-${esc(p.simbolo || "brujula")}" x="31" y="31" width="46" height="46"/></svg>`;
}

/* ---------- resaltado de búsqueda (sin tildes, siempre escapado) ---------- */
/* Normaliza carácter a carácter guardando de qué tramo del original viene cada uno. */
function mapaNormal(t) {
  let n = "";
  const ini = [], fin = [];
  for (let i = 0; i < t.length; ) {
    const ch = String.fromCodePoint(t.codePointAt(i));
    const nn = norm(ch);
    for (let k = 0; k < nn.length; k++) { n += nn[k]; ini.push(i); fin.push(i + ch.length); }
    i += ch.length;
  }
  return { n, ini, fin };
}

/* Tramos [desde, hasta) del original donde aparece algún término. */
function tramos(t, terms) {
  const { n, ini, fin } = mapaNormal(t);
  const r = [];
  terms.forEach((term) => {
    if (!term) return;
    for (let i = n.indexOf(term); i !== -1; i = n.indexOf(term, i + term.length)) {
      r.push([ini[i], fin[i + term.length - 1]]);
    }
  });
  r.sort((a, b) => a[0] - b[0]);
  const unidos = [];
  r.forEach((x) => {
    const u = unidos[unidos.length - 1];
    if (u && x[0] <= u[1]) u[1] = Math.max(u[1], x[1]); else unidos.push([...x]);
  });
  return unidos;
}

/* Escapa cada tramo por separado y envuelve las coincidencias en <mark>. */
export function resaltar(t, terms) {
  const s = String(t ?? "");
  let html = "", pos = 0;
  tramos(s, terms).forEach(([a, b]) => {
    html += esc(s.slice(pos, a)) + `<mark>${esc(s.slice(a, b))}</mark>`;
    pos = b;
  });
  return html + esc(s.slice(pos));
}

/* Fragmento alrededor de la primera coincidencia, recortado en palabras. */
function fragmento(textos, terms, largo = 120) {
  for (const t of textos) {
    const s = String(t ?? "");
    const tr = tramos(s, terms);
    if (!tr.length) continue;
    let desde = Math.max(0, tr[0][0] - 40);
    if (desde > 0) { const sp = s.indexOf(" ", desde); desde = sp !== -1 && sp < tr[0][0] ? sp + 1 : desde; }
    let hasta = Math.min(s.length, desde + largo);
    if (hasta < s.length) { const sp = s.lastIndexOf(" ", hasta); if (sp > tr[0][1]) hasta = sp; }
    return (desde > 0 ? "…" : "") + s.slice(desde, hasta) + (hasta < s.length ? "…" : "");
  }
  return recorte(textos[0], largo);
}

/* Colores del parche como variables CSS; solo se aceptan hexadecimales. */
function estiloParche(p) {
  const color = COLOR.test(p.color) ? p.color : "#622599";
  const texto = COLOR.test(p.texto) ? p.texto : "#ffffff";
  return `--p-color:${color};--p-texto:${texto}`;
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

/* ---------- Inicio ---------- */
function sigueDonde(ctx) {
  const u = (ctx.estado || {}).ultima;
  if (!u || !u.ruta) return "";
  const r = ctx.db.rutas.find((x) => x.id === u.ruta);
  if (!r) return "";
  const pasos = r.pasos || [];
  const id = idDelPaso(r, u.paso);
  const i = Math.max(0, pasos.indexOf(id));
  const c = ctx.byId[pasos[i]];
  return `
      <section class="sigue-donde">
        <a href="#/ruta/${esc(r.id)}">
          <span class="sd-ico">${icono("huella")}</span>
          <span class="sd-txt">
            <span class="sd-eyebrow">Sigue donde ibas</span>
            <strong>${esc(r.titulo)}</strong>
            <span class="sd-paso">Paso ${i + 1} de ${pasos.length}${c ? ` · ${esc(c.termino)}` : ""}</span>
          </span>
          <span class="sd-ir">${icono("flecha")}</span>
        </a>
      </section>`;
}

function fichaDia(ctx, fecha) {
  const c = fichaDelDia(ctx.db.conceptos, fecha);
  if (!c) return "";
  const rama = RAMAS[c.rama];
  const capa = ctx.db.capas.find((k) => k.nivel === c.capa);
  return `
      <section class="ficha-dia${leida(ctx, c.id) ? "" : " nueva"}" ${tinte(c.capa, c.rama)}>
        <p class="section-title">Ficha del día</p>
        <a class="fd-tarjeta" href="#/concepto/${esc(c.id)}">
          <span class="fd-cinta">
            <span class="fd-ico">${icono(ICONO_CAPA[c.capa] || "brujula")}</span>
            <span>${rama ? `${esc(rama.nombre)} · ${esc(rama.unidad)}` : `Capa ${c.capa}${capa ? ` · ${esc(capa.titulo)}` : ""}`}</span>
          </span>
          <span class="fd-cuerpo">
            ${leida(ctx, c.id) ? "" : '<span class="chip nueva">Nueva para ti</span>'}
            <strong class="fd-termino">${esc(c.termino)}</strong>
            <span class="fd-def">${esc(recorte(c.definicion, 150))}</span>
            <span class="fd-ir">Abrir la ficha ${icono("flecha")}</span>
          </span>
        </a>
      </section>`;
}

export function vistaInicio(ctx) {
  const estado = ctx.estado || {};
  const ahora = ctx.ahora || new Date();
  const total = avance(estado, ctx.db.conceptos.map((c) => c.id), "concepto");

  const layers = ctx.db.capas
    .map((c) => {
      const a = avanceCapa(estado, ctx.db, c.nivel);
      return `
      <button class="layer-card" ${tinte(c.nivel)} onclick="go('#/capa/${c.id}')">
        ${anillo(a, ICONO_CAPA[c.nivel] || "brujula")}
        <span class="lc-body">
          <span class="lc-eyebrow">Capa ${c.nivel}</span>
          <h3>${esc(c.titulo)}</h3>
          <p>${esc(c.resumen)}</p>
          <span class="lc-avance">${a.leidas} de ${a.total} fichas</span>
        </span>
      </button>`;
    })
    .join("");

  const rutas = ctx.db.rutas
    .map((r) => {
      const a = avance(estado, r.pasos || [], "concepto");
      return `
      <a class="card list-item ruta-item" href="#/ruta/${esc(r.id)}">
        <h3>${icono("mapa")} ${esc(r.titulo)} ${draftChip(r.estado)}</h3>
        <p>${esc(r.descripcion)}</p>
        <span class="ri-avance">${icono("huella")} ${a.leidas} de ${a.total} pasos</span>
      </a>`;
    })
    .join("");

  return `
    <div class="view inicio">
      <section class="hero">
        <svg class="hero-fondo" aria-hidden="true" focusable="false"><use href="#i-fogata"/></svg>
        <p class="saludo">${saludo(ahora.getHours())}</p>
        <h2 class="hero-titulo">Consulta, aclara y aterriza el Programa de Jóvenes</h2>
        <div class="bitacora-barra" data-leidas="${total.leidas}" data-total="${total.total}">
          <p class="bb-txt"><span class="bb-lbl">${icono("libro")} Tu bitácora</span><span class="bb-num"><strong>${total.leidas}</strong> de ${total.total} fichas</span></p>
          ${pista(total, "bb-pista", "Tu bitácora")}
        </div>
      </section>
      ${sigueDonde(ctx)}
      <p class="section-title">Explorar por capas</p>
      <div class="layers">${layers}</div>
      <div class="search-wrap">
        <span class="si">${icono("lupa")}</span>
        <input type="search" aria-label="Buscar" placeholder="Buscar un concepto o situación…" oninput="go('#/buscar/' + encodeURIComponent(this.value))" />
      </div>
      ${fichaDia(ctx, hoyISO(ahora))}
      <p class="section-title">Rutas guiadas</p>
      ${rutas || '<p class="empty">Aún no hay rutas.</p>'}
      <p class="install-hint">Para instalarla: abre el menú del navegador y elige «Agregar a pantalla de inicio».</p>
    </div>`;
}

/* ---------- Capa ---------- */
function filaFicha(ctx, c) {
  const l = leida(ctx, c.id);
  return `
      <a class="card list-item${l ? " leida" : ""}" ${tinte(c.capa, c.rama)} href="#/concepto/${esc(c.id)}">
        <h3>${esc(c.termino)} ${draftChip(c.estado)}</h3>
        <p>${esc(recorte(c.definicion, 110))}</p>
        ${l ? `<span class="chip chip-visto">${icono("visto")} Leída</span>` : ""}
      </a>`;
}

/* Cabecera del color de la capa (o de la rama/ruta), con puntada y símbolo de fondo. */
function cabecera({ attrs, ico, eyebrow, titulo, bajada, pie }) {
  return `
      <header class="cab-tinte" ${attrs}>
        <span class="cab-ico">${icono(ico)}</span>
        <div class="cab-txt">
          <p class="cab-eyebrow">${eyebrow}</p>
          <h2 class="titulo-vista">${titulo}</h2>
          ${bajada ? `<p class="cab-bajada">${bajada}</p>` : ""}
          ${pie || ""}
        </div>
        <svg class="cab-fondo" aria-hidden="true" focusable="false"><use href="#i-${ico}"/></svg>
      </header>`;
}

/* Panal: cinco hexágonos de rama; cada uno filtra las fichas de su rama. */
function panal(ctx, sel) {
  const celdas = Object.entries(RAMAS)
    .map(([id, r]) => {
      const a = avanceRama(ctx.estado || {}, ctx.db, id);
      const activa = sel === id;
      return `
        <a class="hex-rama${activa ? " activa" : ""}" data-rama="${id}" href="#/capa/ramas/${id}"${activa ? ' aria-current="true"' : ""}>
          <svg class="hex-svg" viewBox="0 0 100 115.47" aria-hidden="true" focusable="false">
            <polygon class="hex-fondo" points="50,2 98,29.7 98,85.8 50,113.5 2,85.8 2,29.7"/>
            <polygon class="hex-puntada" points="50,10 91,33.7 91,81.8 50,105.5 9,81.8 9,33.7"/>
          </svg>
          <span class="hex-txt">
            <span class="hex-nombre">${esc(r.nombre)}</span>
            <span class="hex-unidad">${esc(r.unidad)}</span>
            <span class="hex-avance">${a.leidas}/${a.total}</span>
          </span>
        </a>`;
    })
    .join("");
  return `<nav class="panal" aria-label="Ramas del Programa de Jóvenes">${celdas}</nav>`;
}

export function vistaCapa(ctx, id, sub) {
  const capa = ctx.db.capas.find((c) => c.id === id);
  if (!capa) return vistaNoEncontrada();
  const conceptos = ctx.db.conceptos.filter((c) => c.capa === capa.nivel);
  const a = avanceCapa(ctx.estado || {}, ctx.db, capa.nivel);
  const cab = cabecera({
    attrs: tinte(capa.nivel),
    ico: ICONO_CAPA[capa.nivel] || "brujula",
    eyebrow: `Capa ${capa.nivel}`,
    titulo: esc(capa.titulo),
    bajada: esc(capa.resumen),
    pie: `<p class="cab-avance">${icono("visto")} ${a.leidas} de ${a.total} fichas leídas</p>`,
  });
  const inicio = `<button class="back" onclick="go('#/')">${icono("flecha")} Inicio</button>`;

  if (conceptos.some((c) => RAMAS[c.rama])) {
    const sel = RAMAS[sub] ? sub : null;
    const grupos = Object.entries(RAMAS)
      .filter(([rid]) => !sel || rid === sel)
      .map(([rid, r]) => {
        const fichas = conceptos.filter((c) => c.rama === rid);
        if (!fichas.length) return "";
        return `
      <section class="grupo-rama" data-rama="${rid}">
        <h3 class="grupo-titulo"><span class="hex-mini" aria-hidden="true"></span>${esc(r.nombre)} <span class="gt-unidad">· ${esc(r.unidad)}</span></h3>
        ${fichas.map((c) => filaFicha(ctx, c)).join("")}
      </section>`;
      })
      .join("");
    const sueltas = sel ? [] : conceptos.filter((c) => !RAMAS[c.rama]);
    return `
    <div class="view capa" ${tinte(capa.nivel)}>
      ${inicio}
      ${cab}
      <p class="section-title">Elige una rama</p>
      ${panal(ctx, sel)}
      <div id="fichas-rama" class="fichas-rama">
        ${sel ? `<p class="filtro-rama">Solo ${esc(RAMAS[sel].nombre)} · <a href="#/capa/${esc(capa.id)}">Ver todas las ramas</a></p>` : ""}
        ${grupos}
        ${sueltas.map((c) => filaFicha(ctx, c)).join("")}
      </div>
    </div>`;
  }

  const items = conceptos.map((c) => filaFicha(ctx, c)).join("") || '<p class="empty">Esta capa aún no tiene conceptos cargados.</p>';
  return `
    <div class="view capa" ${tinte(capa.nivel)}>
      ${inicio}
      ${cab}
      <p class="section-title">Fichas</p>
      ${items}
    </div>`;
}

export function vistaConcepto(ctx, id, query = "") {
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
  // Si se llegó desde una ruta (?ruta=…&paso=n), enlaza al paso siguiente o a la ruta.
  const q = new URLSearchParams(query);
  const ruta = ctx.db.rutas.find((r) => r.id === q.get("ruta"));
  const n = Number(q.get("paso"));
  let siguiente = "";
  if (ruta && Number.isInteger(n) && (ruta.pasos || [])[n - 1] === id) {
    const sig = ctx.byId[(ruta.pasos || [])[n]];
    siguiente = sig
      ? `<nav class="siguiente-en-ruta" aria-label="Siguiente en la ruta"><a href="#/concepto/${esc(sig.id)}?ruta=${esc(ruta.id)}&amp;paso=${n + 1}"><span class="sr-eyebrow">Siguiente en la ruta · paso ${n + 1} de ${ruta.pasos.length}</span><strong>${esc(sig.termino)}</strong>${icono("flecha")}</a></nav>`
      : `<nav class="siguiente-en-ruta" aria-label="Fin de la ruta"><a href="#/ruta/${esc(ruta.id)}"><span class="sr-eyebrow">Último paso de la ruta</span><strong>Volver a ${esc(ruta.titulo)}</strong>${icono("flecha")}</a></nav>`;
  }
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
      ${siguiente}
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

/* ---------- Ruta: sendero vertical de huellas ---------- */
export function vistaRuta(ctx, id) {
  const r = ctx.db.rutas.find((x) => x.id === id);
  if (!r) return vistaNoEncontrada();
  const estado = ctx.estado || {};
  const conceptos = (r.pasos || []).map((pid) => ctx.byId[pid]).filter(Boolean);
  const a = avance(estado, conceptos.map((c) => c.id), "concepto");
  const u = estado.ultima;
  const actual = u && u.ruta === r.id ? idDelPaso(r, u.paso) : undefined;
  const parche = ctx.db.parches.find((p) => p.criterio && p.criterio.ruta === r.id);
  const ganado = parche && (estado.parches || {})[parche.id];

  const pasos = conceptos
    .map((c, i) => {
      const l = leida(ctx, c.id);
      const esActual = c.id === actual;
      return `
        <li>
          <a class="paso${l ? " leido" : ""}${esActual ? " actual" : ""}" data-id="${esc(c.id)}" href="#/concepto/${esc(c.id)}?ruta=${esc(r.id)}&amp;paso=${i + 1}"${esActual ? ' aria-current="step"' : ""}>
            <span class="paso-col" aria-hidden="true">
              <span class="paso-nodo">${l ? icono("visto") : i + 1}</span>
              <span class="huellas">${icono("huella")}${icono("huella")}</span>
            </span>
            <span class="paso-txt">
              <span class="paso-num">Paso ${i + 1}${l ? " · leída" : ""}${esActual ? " · aquí ibas" : ""}</span>
              <strong>${esc(c.termino)}</strong>
              <span class="paso-def">${esc(recorte(c.definicion, 96))}</span>
            </span>
          </a>
        </li>`;
    })
    .join("");

  const meta = parche
    ? `
        <li class="meta${ganado ? " ganado" : ""}">
          <span class="meta-parche" style="${estiloParche(parche)}">${formaParche(parche)}</span>
          <span class="meta-txt">
            <span class="paso-num">Meta</span>
            <strong>Parche «${esc(parche.titulo)}»</strong>
            <span class="paso-def">${ganado ? `Cosido en tu mochila el ${fechaTexto(ganado)}.` : `Lee los ${conceptos.length} pasos, en cualquier orden, para coserlo en tu mochila.`}</span>
          </span>
        </li>`
    : "";

  const aviso = rutaCrecio(estado, ctx.db, r.id)
    ? `<p class="aviso aviso-ruta-nueva" role="status">${icono("huella")} Hay una ficha nueva en esta ruta desde que ganaste su parche.</p>`
    : "";

  return `
    <div class="view ruta" ${tinteDeRuta(conceptos)}>
      <button class="back" onclick="go('#/')">${icono("flecha")} Inicio</button>
      ${cabecera({
        attrs: tinteDeRuta(conceptos),
        ico: "mapa",
        eyebrow: `Ruta guiada · ${conceptos.length} pasos`,
        titulo: `${esc(r.titulo)} ${draftChip(r.estado)}`,
        bajada: esc(r.descripcion),
        pie: `<div class="cab-progreso"><span>${a.leidas} de ${a.total} pasos leídos</span>${pista(a, "cab-pista", "Avance de la ruta")}</div>`,
      })}
      ${aviso}
      <p class="section-title">Sigue el sendero</p>
      <ol class="sendero route-steps">${pasos}${meta}</ol>
    </div>`;
}

/* ---------- Buscar ---------- */
function chipDe(c) {
  const rama = RAMAS[c.rama];
  return `<span class="chip chip-capa" ${tinte(c.capa, c.rama)}>${rama ? esc(rama.nombre) : `Capa ${c.capa}`}</span>`;
}

export function resultadosBusqueda(ctx, q) {
  if (!q || !norm(q).trim()) return '<p class="empty">Escribe para buscar conceptos y situaciones.</p>';
  const terms = norm(q).trim().split(/\s+/);
  const res = buscar(ctx, q);
  const cs = res.conceptos
    .map(
      (c) => `
      <a class="card list-item" ${tinte(c.capa, c.rama)} href="#/concepto/${esc(c.id)}">
        <h3>${resaltar(c.termino, terms)} ${draftChip(c.estado)}</h3>
        <p>${resaltar(fragmento([c.definicion, c.enLaPractica], terms), terms)}</p>
        <span class="chips">${chipDe(c)}${leida(ctx, c.id) ? `<span class="chip chip-visto">${icono("visto")} Leída</span>` : ""}</span>
      </a>`
    )
    .join("");
  const ss = res.situaciones
    .map(
      (s) => `
      <a class="card list-item" data-capa="3" href="#/situacion/${esc(s.id)}">
        <h3>${icono("dialogo")} ${resaltar(s.titulo, terms)}</h3>
        <p>${resaltar(fragmento([s.caso, s.doctrina], terms), terms)}</p>
        <span class="chips"><span class="chip chip-capa" data-capa="3">Situación</span></span>
      </a>`
    )
    .join("");
  const total = res.conceptos.length + res.situaciones.length;
  if (total === 0) return '<p class="empty">Sin resultados. Prueba con otra palabra.</p>';
  return `<p class="res-total">${total} ${total === 1 ? "resultado" : "resultados"}</p>${cs ? `<p class="section-title">Conceptos</p>${cs}` : ""}${ss ? `<p class="section-title">Situaciones</p>${ss}` : ""}`;
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

/* ---------- Mochila: parches, avance por capa y por rama ---------- */
function filaAvance(attrs, ico, nombre, a) {
  return `
        <li class="avance-fila" ${attrs}>
          <span class="af-ico">${icono(ico)}</span>
          <span class="af-nombre">${nombre}</span>
          <span class="af-num">${a.leidas} de ${a.total}</span>
          ${pista(a, "af-pista", `Avance de ${nombre}`)}
        </li>`;
}

export function vistaMochila(ctx) {
  const estado = ctx.estado || {};
  const ganados = estado.parches || {};
  const tarjeta = (p) => {
    const tipo = tipoDeCriterio(p);
    const a = avance(estado, idsDeCriterio(p, ctx.db), tipo);
    const fecha = ganados[p.id];
    const unidad = tipo === "situacion" ? "situaciones" : "fichas";
    return `
        <li class="parche${fecha ? " ganado" : ""}" data-id="${esc(p.id)}" data-forma="${p.forma === "hexagono" ? "hexagono" : "circulo"}" style="${estiloParche(p)}">
          ${formaParche(p)}
          <span class="parche-titulo">${esc(p.titulo)}</span>
          ${fecha
            ? `<span class="parche-estado">${icono("visto")} Cosido el ${fechaTexto(fecha)}</span>`
            : `<span class="parche-estado">${a.leidas} de ${a.total} ${unidad}</span>${pista(a, "parche-pista", `Avance de ${p.titulo}`)}`}
        </li>`;
  };
  const cosidos = ctx.db.parches.filter((p) => ganados[p.id]);
  const porCoser = ctx.db.parches.filter((p) => !ganados[p.id]);
  const resumen = { leidas: cosidos.length, total: ctx.db.parches.length };

  const capas = ctx.db.capas
    .map((c) => filaAvance(tinte(c.nivel), ICONO_CAPA[c.nivel] || "brujula", `Capa ${c.nivel} · ${esc(c.titulo)}`, avanceCapa(estado, ctx.db, c.nivel)))
    .join("");
  const ramas = Object.entries(RAMAS)
    .map(([id, r]) => filaAvance(tinte(2, id), "panal", `${esc(r.nombre)} · ${esc(r.unidad)}`, avanceRama(estado, ctx.db, id)))
    .join("");

  const aviso = ctx.almacenDisponible === false
    ? `<p class="aviso aviso-almacen" role="status">${icono("mochila")} Este navegador no deja guardar tu avance: se conserva solo mientras la app siga abierta.</p>`
    : "";

  return `
    <div class="view mochila">
      <header class="cab-tinte mochila-cab">
        <span class="cab-ico">${icono("mochila")}</span>
        <div class="cab-txt">
          <p class="cab-eyebrow">Tu mochila</p>
          <h2 class="titulo-vista">${resumen.leidas} de ${resumen.total} parches cosidos</h2>
          <p class="cab-bajada">Cada parche se cose al leer todas sus fichas, en cualquier orden. Tu avance queda solo en este teléfono.</p>
          ${pista(resumen, "cab-pista", "Parches cosidos")}
        </div>
      </header>
      ${aviso}
      ${cosidos.length ? `<p class="section-title">Cosidos</p><ul class="parches">${cosidos.map(tarjeta).join("")}</ul>` : ""}
      ${porCoser.length ? `<p class="section-title">Por coser</p><ul class="parches">${porCoser.map(tarjeta).join("")}</ul>` : ""}
      <p class="section-title">Avance por capa</p>
      <ul class="avance-lista">${capas}</ul>
      <p class="section-title">Avance por rama</p>
      <ul class="avance-lista">${ramas}</ul>
      <section class="reiniciar">
        <button id="reiniciar-avance" class="btn-secundario" type="button">Reiniciar mi avance</button>
        <p class="nota">Borra las fichas leídas y los parches guardados en este teléfono. Antes te pediremos confirmación.</p>
      </section>
    </div>`;
}
