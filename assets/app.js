/* Programa Scout — lógica de la app (módulo ES, sin build)
   SPA con enrutado por hash. Datos curados en /data (fuente de verdad).
   Las vistas viven en vistas.js. */
import {
  vistaInicio, vistaCapa, vistaConcepto, vistaSituacion, vistaRuta,
  vistaBuscar, resultadosBusqueda, vistaSituaciones, vistaMochila,
} from "./vistas.js";
import { leer, guardar, reiniciar, disponible } from "./almacen.js";
import { marcarLeida, ganarParches, avanceCapa } from "./progreso.js";
import { hoyISO } from "./vistas.js";

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
function vigilarLectura(tipo, id, objetivo) {
  if (observador) { observador.disconnect(); observador = null; }
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

/* ---------- router ---------- */
function render() {
  const hash = location.hash || "#/";
  const [, route, rawParam, sub] = hash.replace(/^#\//, "#/").split("/");
  // La consulta (?ruta=…&paso=…) se separa del parámetro antes de buscar el id.
  const corte = rawParam ? rawParam.indexOf("?") : -1;
  const param = corte === -1 ? rawParam : rawParam.slice(0, corte);
  const query = corte === -1 ? "" : rawParam.slice(corte + 1);
  if (route === "concepto" && byId[param]) recordarUltima(param, query);
  ctx.estado = leer();
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
    default: html = vistaInicio(ctx);
  }
  app.innerHTML = html;
  app.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  updateTabbar(route);
  // Lectura real: la fuente (ficha) o el último bloque (situación) debe entrar en pantalla.
  if (route === "concepto" && byId[param]) vigilarLectura("concepto", param, app.querySelector(".detail .fuente"));
  else if (route === "situacion" && ctx.db.situaciones.some((x) => x.id === param)) vigilarLectura("situacion", param, [...app.querySelectorAll(".detail .block")].pop());
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
  ctx.estado = reiniciar();
  render();
});

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
