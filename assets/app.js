/* Programa Scout — lógica de la app (módulo ES, sin build)
   SPA con enrutado por hash. Datos curados en /data (fuente de verdad).
   Las vistas viven en vistas.js. */
import {
  vistaInicio, vistaCapa, vistaConcepto, vistaSituacion, vistaRuta,
  vistaBuscar, resultadosBusqueda, vistaSituaciones, vistaMochila,
} from "./vistas.js";
import { leer, disponible } from "./almacen.js";

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
  history.replaceState(null, "", "#/buscar/" + encodeURIComponent(q));
}
window.runSearch = runSearch;

/* ---------- router ---------- */
function render() {
  const hash = location.hash || "#/";
  const [, route, param, sub] = hash.replace(/^#\//, "#/").split("/");
  ctx.estado = leer(); // solo lectura; marcar fichas llega en la Task 6
  let html;
  switch (route) {
    case "": html = vistaInicio(ctx); break;
    case "capa": html = vistaCapa(ctx, param, sub); break;
    case "concepto": html = vistaConcepto(ctx, param); break;
    case "situacion": html = vistaSituacion(ctx, param); break;
    case "situaciones": html = vistaSituaciones(ctx); break;
    case "ruta": html = vistaRuta(ctx, param); break;
    case "buscar": html = vistaBuscar(ctx, param ? decodeURIComponent(param) : ""); break;
    case "mochila": html = vistaMochila(ctx); break;
    default: html = vistaInicio(ctx);
  }
  app.innerHTML = html;
  app.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  updateTabbar(route);
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

/* ---------- tema ---------- */
function initTheme() {
  const saved = localStorage.getItem("ps-theme");
  if (saved) document.documentElement.dataset.theme = saved;
  document.getElementById("theme-btn").onclick = () => {
    const cur = document.documentElement.dataset.theme === "dark" ? "" : "dark";
    document.documentElement.dataset.theme = cur;
    localStorage.setItem("ps-theme", cur);
  };
}

/* ---------- arranque ---------- */
window.go = go;
(async function init() {
  initTheme();
  ctx.almacenDisponible = disponible();
  await loadData();
  window.addEventListener("hashchange", render);
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
