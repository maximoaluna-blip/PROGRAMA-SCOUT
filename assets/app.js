/* Programa Scout — lógica de la app (módulo ES, sin build)
   SPA con enrutado por hash. Datos curados en /data (fuente de verdad).
   Las vistas viven en vistas.js. */
import {
  vistaInicio, vistaCapa, vistaConcepto, vistaSituacion, vistaRuta,
  vistaBuscar, resultadosBusqueda, vistaSituaciones, vistaMochila, vistaBienvenida,
} from "./vistas.js";
import { leer, guardar, reiniciar, disponible, estadoInicial } from "./almacen.js";
import { configurar, activo, tocar, fogata } from "./sonido.js";
import { marcarLeida, ganarParches, avanceCapa } from "./progreso.js";
import { hoyISO } from "./vistas.js";
import { montarEscena, movimientoReducido } from "./escena.js";
import { celebrarParche, animarVisto, cerrarCelebracion } from "./celebracion.js";

const DB = { capas: [], conceptos: [], situaciones: [], rutas: [], parches: [] };
const byId = {};
const ctx = { db: DB, byId, estado: leer(), almacenDisponible: true };
const app = document.getElementById("app");

const go = (hash) => { location.hash = hash; };

/* ---------- carga de datos ---------- */
async function loadData() {
  const files = ["capas", "conceptos", "situaciones", "rutas", "parches"];
  const results = await Promise.all(
    files.map((f) => fetch(`./data/${f}.json`).then((r) => r.json()))
  );
  files.forEach((f, i) => (DB[f] = results[i]));
  DB.conceptos.forEach((c) => (byId[c.id] = c));
}

/* Búsqueda en vivo: actualiza SOLO los resultados, sin re-renderizar el
   cuadro de texto (así no se pierde el foco al escribir). El hash se
   sincroniza con replaceState, que no dispara render(). */
function runSearch(q) {
  const cont = document.getElementById("search-results");
  if (cont) cont.innerHTML = resultadosBusqueda(ctx, q);
  history.replaceState(history.state, "", "#/buscar/" + encodeURIComponent(q));
}
window.runSearch = runSearch;

/* ---------- progreso ---------- */
/* Marca una ficha o situación como leída, guarda, gana parches y avisa.
   Devuelve los parches recién ganados. Tareas 7 y 8 (sonido, celebración)
   se cuelgan de los eventos `ps:leida` y `ps:parche`. */
export function alLeer(tipo, id) {
  const fecha = hoyISO();
  const { estado, nueva } = marcarLeida(leer(), tipo, id, fecha);
  let final = estado, nuevos = [];
  if (nueva) {
    const g = ganarParches(estado, DB, fecha);
    final = g.estado;
    nuevos = g.nuevos;
    if (!guardar(final)) ctx.almacenDisponible = false;
  }
  ctx.estado = final;
  document.dispatchEvent(new CustomEvent("ps:leida", { detail: { tipo, id, nueva } }));
  const c = tipo === "concepto" ? byId[id] : null;
  const capaCompleta = c ? (() => { const a = avanceCapa(final, DB, c.capa); return a.total > 0 && a.leidas === a.total; })() : false;
  nuevos.forEach((parche) => {
    const completo = parche.forma === "hexagono" || parche.id === "bitacora-completa" || capaCompleta;
    document.dispatchEvent(new CustomEvent("ps:parche", { detail: { parche, completo } }));
  });
  return nuevos;
}

/* Si la ficha se abrió desde una ruta (?ruta=…&paso=n, n desde 1), recuerda dónde ibas. */
function recordarUltima(id, query) {
  const q = new URLSearchParams(query);
  const ruta = DB.rutas.find((r) => r.id === q.get("ruta"));
  const n = Number(q.get("paso"));
  if (!ruta || !Number.isInteger(n) || (ruta.pasos || [])[n - 1] !== id) return;
  const estado = leer();
  if (estado.ultima && estado.ultima.ruta === ruta.id && estado.ultima.paso === n) return;
  const nuevo = { ...estado, ultima: { ruta: ruta.id, paso: n } };
  if (!guardar(nuevo)) ctx.almacenDisponible = false;
  ctx.estado = nuevo;
}

/* Una ficha cuenta como leída cuando su bloque final entra en pantalla (60 %).
   Si el bloque es más alto que el 60 % de la pantalla, basta con llenarla. */
let observador = null;
let objetivoLectura = null; // donde se pone el sello «Leída» al contar la lectura
function vigilarLectura(tipo, id, objetivo) {
  if (observador) { observador.disconnect(); observador = null; }
  objetivoLectura = objetivo || null;
  if (!objetivo || !("IntersectionObserver" in window)) return;
  observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      const alto = e.rootBounds ? e.rootBounds.height : window.innerHeight;
      if (e.isIntersecting && (e.intersectionRatio >= 0.6 || e.intersectionRect.height >= alto * 0.6)) {
        observador.disconnect();
        observador = null;
        alLeer(tipo, id);
        return;
      }
    }
  }, { threshold: [0, 0.6, 1] });
  observador.observe(objetivo);
}

/* ---------- movimiento de navegación ---------- */
/* Dirección: cada entrada del historial lleva su número; volver a uno menor es «atrás». */
let posicion = null;
function direccion() {
  const st = history.state;
  if (st && typeof st.n === "number") {
    const atras = posicion !== null && st.n < posicion;
    posicion = st.n;
    return atras ? "atras" : "adelante";
  }
  posicion = posicion === null ? 0 : posicion + 1;
  try { history.replaceState({ ...(st || {}), n: posicion }, ""); } catch (e) { /* sin historial */ }
  return "adelante";
}

/* Tarjetas en cascada: 40 ms entre una y otra (solo las primeras, para no demorar). */
const EN_CASCADA = ".layer-card, .list-item, .sigue-donde, .fd-tarjeta, .hex-rama, .sendero > li, .parche, .avance-fila";
function cascada(raiz) {
  [...raiz.querySelectorAll(EN_CASCADA)].slice(0, 14).forEach((el, i) => {
    el.style.setProperty("--i", i);
    el.classList.add("cascada");
  });
}

let desmontarEscena = null;
let datosListos = false;

/* Anillos de capa en Inicio: avanzan desde el último valor mostrado (en memoria,
   no en localStorage). Una «tapa» del color de la pista cubre el tramo nuevo y
   gira hasta descubrirlo: solo transform y opacity. Sin avance, no se anima. */
const anillosVistos = {};
function recordarAnillos() {
  DB.capas.forEach((c) => {
    const a = avanceCapa(ctx.estado, DB, c.nivel);
    anillosVistos[c.nivel] = a.total ? Math.round((a.leidas * 100) / a.total) : 0;
  });
}
function avanzarAnillos(raiz) {
  raiz.querySelectorAll(".layer-card[data-capa]").forEach((card) => {
    const capa = card.dataset.capa;
    const anillo = card.querySelector(".anillo");
    const svg = anillo && anillo.querySelector(".anillo-svg");
    if (!svg) return;
    const ahora = Number(anillo.dataset.pct) || 0;
    const antes = anillosVistos[capa];
    anillosVistos[capa] = ahora;
    if (antes === undefined || ahora <= antes || movimientoReducido()) return;
    const delta = ahora - antes;
    const tapa = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    tapa.setAttribute("class", "anillo-tapa");
    for (const [k, v] of Object.entries({ cx: 28, cy: 28, r: 25, pathLength: 100, "stroke-dasharray": `${delta} 100`, "stroke-dashoffset": -antes })) tapa.setAttribute(k, v);
    tapa.style.setProperty("--giro", `${delta * 3.6}deg`);
    tapa.addEventListener("animationend", () => tapa.remove());
    svg.appendChild(tapa);
  });
}

/* ---------- router ---------- */
function render() {
  ctx.estado = leer();
  /* Primera visita: solo el inicio vacío (``, `#`, `#/`) lleva a la bienvenida;
     un enlace profundo abre su destino. replaceState: «atrás» no vuelve a un #/ que redirige. */
  if (!ctx.estado.bienvenida && ["", "#", "#/"].includes(location.hash)) {
    try { history.replaceState(history.state, "", "#/bienvenida"); } catch (e) { /* sin historial */ }
  }
  const hash = location.hash || "#/";
  const [, route, rawParam, sub] = hash.replace(/^#\//, "#/").split("/");
  // La consulta (?ruta=…&paso=…) se separa del parámetro antes de buscar el id.
  const corte = rawParam ? rawParam.indexOf("?") : -1;
  const param = corte === -1 ? rawParam : rawParam.slice(0, corte);
  const query = corte === -1 ? "" : rawParam.slice(corte + 1);
  if (route === "concepto" && byId[param]) recordarUltima(param, query);
  ctx.estado = leer();
  const enBienvenida = route === "bienvenida";
  // La bienvenida no usa datos: se pinta sin esperarlos (sin destello de «Cargando…»).
  if (!datosListos && !enBienvenida) return;
  let html;
  switch (route) {
    case "": html = vistaInicio(ctx); break;
    case "capa": html = vistaCapa(ctx, param, sub); break;
    case "concepto": html = vistaConcepto(ctx, param, query); break;
    case "situacion": html = vistaSituacion(ctx, param); break;
    case "situaciones": html = vistaSituaciones(ctx); break;
    case "ruta": html = vistaRuta(ctx, param); break;
    case "buscar": html = vistaBuscar(ctx, param ? decodeURIComponent(param) : ""); break;
    case "mochila": html = vistaMochila(ctx); break;
    case "bienvenida": html = vistaBienvenida(ctx); break;
    default: html = vistaInicio(ctx);
  }
  desmontarEscena?.();
  desmontarEscena = null;
  if (enBienvenida) cerrarCelebracion();
  document.body.classList.toggle("en-bienvenida", enBienvenida);
  app.innerHTML = html;
  const vista = app.firstElementChild;
  if (vista && vista.classList.contains("view")) {
    if (direccion() === "atras") vista.classList.add("entra-atras");
    cascada(vista);
  }
  avanzarAnillos(app);
  const hero = app.querySelector(".inicio .hero");
  if (hero) desmontarEscena = montarEscena(hero, {
    fogata: true, estrellas: 12,
    // Franja de arriba y columna derecha (junto a la fogata): lejos del saludo y del título.
    zonas: [{ x: [6, 94], y: [2, 6] }, { x: [83, 97], y: [36, 58] }, { x: [60, 80], y: [2, 7] }],
  });
  if (enBienvenida) desmontarEscena = montarBienvenida(app.querySelector(".bienvenida"));
  app.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  updateTabbar(route);
  // Lectura real: la fuente (ficha) o «Cómo aplicarlo» (situación) debe entrar en pantalla.
  if (route === "concepto" && byId[param]) vigilarLectura("concepto", param, app.querySelector(".detail .fuente"));
  else if (route === "situacion" && ctx.db.situaciones.some((x) => x.id === param)) vigilarLectura("situacion", param, app.querySelector(".detail .practica"));
  else vigilarLectura(null, null, null);
  // Panal: al elegir una rama, se baja a sus fichas.
  if (route === "capa" && sub) document.getElementById("fichas-rama")?.scrollIntoView({ block: "start" });
  if (route === "buscar") {
    const inp = document.getElementById("q-input");
    if (inp) { inp.focus(); const v = inp.value; inp.value = ""; inp.value = v; }
  }
}

function updateTabbar(route) {
  document.querySelectorAll(".tabbar a").forEach((a) => {
    const activa = a.dataset.route === (route || "");
    a.classList.toggle("active", activa);
    if (activa) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  moverPastilla();
}

/* Pastilla de la barra inferior: se ubica bajo el ícono de la pestaña activa.
   Solo se anima transform (la transición se activa tras la primera ubicación). */
function moverPastilla() {
  const bar = document.querySelector(".tabbar");
  const p = bar && bar.querySelector(".pastilla");
  if (!p) return;
  const ti = bar.querySelector("a.active .ti");
  if (!ti) { p.style.opacity = "0"; return; }
  const rb = bar.getBoundingClientRect(), rt = ti.getBoundingClientRect();
  p.style.width = rt.width + "px";
  p.style.height = rt.height + "px";
  p.style.top = rt.top - rb.top - bar.clientTop + "px";
  p.style.transform = `translateX(${rt.left - rb.left - bar.clientLeft}px)`;
  p.style.opacity = "1";
  if (!bar.classList.contains("con-pastilla")) {
    bar.classList.add("con-pastilla");
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add("pastilla-lista")));
  }
}
window.addEventListener("resize", moverPastilla);

/* ---------- reinicio del avance ---------- */
document.addEventListener("click", (e) => {
  if (!e.target.closest || !e.target.closest("#reiniciar-avance")) return;
  if (!confirm("¿Borrar tu avance en este teléfono?")) return;
  /* Sonido y bienvenida son preferencias, no avance: sobreviven al reinicio. */
  const { sonido, bienvenida } = ctx.estado;
  reiniciar();
  ctx.estado = { ...estadoInicial(), sonido, bienvenida };
  guardar(ctx.estado);
  render();
});

/* ---------- sonido ---------- */
const TOCABLES = ".layer-card, .list-item, .tabbar a, .hex-rama";
function pintarSonido() {
  const b = document.getElementById("sonido-btn");
  if (!b) return;
  const on = activo();
  b.hidden = false;
  b.setAttribute("aria-label", "Sonido");
  b.setAttribute("aria-pressed", String(on));
  const uso = b.querySelector("use");
  if (uso) uso.setAttribute("href", on ? "#i-altavoz" : "#i-altavoz-off");
}
function initSonido() {
  configurar(ctx.estado.sonido === true);
  pintarSonido();
  document.getElementById("sonido-btn")?.addEventListener("click", () => {
    const on = !activo();
    configurar(on);
    ctx.estado = { ...ctx.estado, sonido: on };
    guardar(ctx.estado);
    pintarSonido();
    pintarInterruptor();
    if (on) tocar("tic");
  });
  /* Tic solo en toques reales del usuario (no en clics programáticos). */
  document.addEventListener("click", (e) => {
    if (e.isTrusted && e.target.closest && e.target.closest(TOCABLES)) tocar("tic");
  });
  document.addEventListener("ps:leida", (e) => { if (e.detail && e.detail.nueva === true) tocar("leida"); });
  /* El sonido del parche o de la capa suena al aparecer su hoja (ver initCelebracion). */
}

/* ---------- bienvenida ---------- */
/* Escena nocturna y crepitar de fogata. El crepitar suena solo con el sonido activo
   (sonido.js exige además un gesto real); se apaga al salir o con la pestaña oculta. */
function montarBienvenida(raiz) {
  if (!raiz) return null;
  const desmontar = montarEscena(raiz, {
    fogata: true, estrellas: 14,
    // Cielo sobre los cerros, a los lados de la fogata.
    zonas: [{ x: [5, 38], y: [2, 17] }, { x: [62, 95], y: [2, 17] }, { x: [40, 60], y: [1, 5] }],
  });
  const alVer = () => fogata(!document.hidden && activo());
  document.addEventListener("visibilitychange", alVer);
  alVer();
  return () => {
    document.removeEventListener("visibilitychange", alVer);
    fogata(false);
    desmontar();
  };
}

function pintarInterruptor() {
  const sw = document.getElementById("sonido-toggle");
  if (sw) sw.setAttribute("aria-checked", String(activo()));
  if (document.body.classList.contains("en-bienvenida")) fogata(!document.hidden && activo());
}

/* Cambiar el sonido aquí lo deja guardado como el botón de la cabecera;
   «Empezar» guarda además que la bienvenida ya se vio. */
function ponerSonido(on) {
  configurar(on);
  ctx.estado = { ...leer(), sonido: on };
  if (!guardar(ctx.estado)) ctx.almacenDisponible = false;
  pintarSonido();
  pintarInterruptor();
  if (on) tocar("tic");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest) return;
  if (e.target.closest("#sonido-toggle")) {
    ponerSonido(document.getElementById("sonido-toggle").getAttribute("aria-checked") !== "true");
  } else if (e.target.closest("#empezar")) {
    const on = document.getElementById("sonido-toggle")?.getAttribute("aria-checked") === "true";
    configurar(on);
    ctx.estado = { ...leer(), bienvenida: true, sonido: on };
    if (!guardar(ctx.estado)) ctx.almacenDisponible = false;
    pintarSonido();
    go("#/");
  }
});

/* ---------- celebración ---------- */
/* Colores y símbolos de capa (spec §2.1) para celebrar una capa completa sin parche propio. */
const CAPA_COLOR = [["#622599", "#ffffff"], ["#003087", "#ffffff"], ["#ffd00f", "#3d2e00"], ["#00a23b", "#03260e"]];
const CAPA_SIMBOLO = ["brujula", "libro", "panal", "nudo"];
function initCelebracion() {
  /* Una sola celebración por lectura: si la misma lectura gana parche, la capa
     completa se celebra dentro de la hoja del parche (tratamiento «completo»). */
  let parcheEnEstaLectura = false;
  document.addEventListener("ps:leida", (e) => {
    const d = e.detail || {};
    if (d.nueva !== true) return;
    parcheEnEstaLectura = false;
    animarVisto(objetivoLectura);
    const c = d.tipo === "concepto" ? byId[d.id] : null;
    if (!c) return;
    const a = avanceCapa(ctx.estado, DB, c.capa);
    if (!(a.total > 0 && a.leidas === a.total)) return;
    // ps:parche, si lo hay, se emite en este mismo turno: se decide al terminarlo.
    queueMicrotask(() => {
      if (parcheEnEstaLectura) return;
      const capa = DB.capas.find((k) => k.nivel === c.capa) || {};
      const [color, texto] = CAPA_COLOR[c.capa] || CAPA_COLOR[0];
      celebrarParche(
        { id: `capa-${c.capa}`, titulo: `Capa ${c.capa} · ${capa.titulo || ""}`.replace(/ · $/, ""), color, texto,
          simbolo: CAPA_SIMBOLO[c.capa] || "brujula", forma: "circulo",
          mensaje: `Leíste las ${a.total} fichas de esta capa.` },
        { completo: true, etiqueta: "Capa completa", alMostrar: () => tocar("completo") },
      );
    });
  });
  document.addEventListener("ps:parche", (e) => {
    const { parche, completo } = e.detail || {};
    if (!parche) return;
    parcheEnEstaLectura = true;
    const etiqueta = parche.id === "bitacora-completa" ? "Bitácora completa"
      : parche.forma === "hexagono" ? "Rama completa"
      : completo ? "Parche ganado · Capa completa" : "Parche ganado";
    celebrarParche(parche, { completo: Boolean(completo), etiqueta, alMostrar: () => tocar(completo ? "completo" : "parche") });
  });
}

/* ---------- tema ---------- */
function initTheme() {
  // El script de index.html ya aplicó el tema guardado antes del primer pintado; aquí se repite por si falló.
  let saved = null;
  try { saved = localStorage.getItem("ps-theme"); } catch (e) { /* almacenamiento bloqueado */ }
  if (saved) document.documentElement.dataset.theme = saved;
  document.getElementById("theme-btn").onclick = () => {
    const cur = document.documentElement.dataset.theme === "dark" ? "" : "dark";
    document.documentElement.dataset.theme = cur;
    try { localStorage.setItem("ps-theme", cur); } catch (e) { /* el tema vale solo en esta sesión */ }
  };
}

/* ---------- arranque ---------- */
window.go = go;
(async function init() {
  initTheme();
  initSonido();
  initCelebracion();
  ctx.almacenDisponible = disponible();
  window.addEventListener("hashchange", render);
  render(); // solo pinta si toca la bienvenida
  const yaPintada = Boolean(app.querySelector(".bienvenida"));
  await loadData();
  datosListos = true;
  recordarAnillos();
  // Si mientras cargaba se salió de la bienvenida, ahora sí se pinta el destino.
  if (!(yaPintada && location.hash === "#/bienvenida")) render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
