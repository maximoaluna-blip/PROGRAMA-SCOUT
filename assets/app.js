/* Programa Scout — lógica de la app (módulo ES, sin build)
   SPA con enrutado por hash. Datos curados en /data (fuente de verdad).
   Las vistas viven en vistas.js. */
import {
  vistaInicio, vistaCapa, vistaConcepto, vistaSituacion, vistaRuta,
  vistaBuscar, resultadosBusqueda, vistaSituaciones, vistaNoEncontrada,
} from "./vistas.js";

const DB = { capas: [], conceptos: [], situaciones: [], rutas: [], parches: [] };
const byId = {};
const ctx = { db: DB, byId, estado: {} };
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
  const [, route, param] = hash.replace(/^#\//, "#/").split("/");
  let html;
  switch (route) {
    case "": html = vistaInicio(ctx); break;
    case "capa": html = vistaCapa(ctx, param); break;
    case "concepto": html = vistaConcepto(ctx, param); break;
    case "situacion": html = vistaSituacion(ctx, param); break;
    case "situaciones": html = vistaSituaciones(ctx); break;
    case "ruta": html = vistaRuta(ctx, param); break;
    case "buscar": html = vistaBuscar(ctx, param ? decodeURIComponent(param) : ""); break;
    case "mochila": html = vistaNoEncontrada(); break; // la Mochila llega en la Task 5
    default: html = vistaInicio(ctx);
  }
  app.innerHTML = html;
  app.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  updateTabbar(route);
  if (route === "buscar") {
    const inp = document.getElementById("q-input");
    if (inp) { inp.focus(); const v = inp.value; inp.value = ""; inp.value = v; }
  }
}

function updateTabbar(route) {
  document.querySelectorAll(".tabbar a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === (route || ""));
  });
}

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
  await loadData();
  window.addEventListener("hashchange", render);
  render();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
})();
