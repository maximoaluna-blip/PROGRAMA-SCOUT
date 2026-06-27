/* Programa Scout — lógica de la app (vanilla JS, sin build)
   SPA con enrutado por hash. Datos curados en /data (fuente de verdad). */

const DB = { capas: [], conceptos: [], situaciones: [], rutas: [] };
const byId = {};
const app = document.getElementById("app");

/* ---------- utilidades ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const go = (hash) => { location.hash = hash; };

function draftChip(estado) {
  return estado === "auditado" ? "" : '<span class="chip draft">borrador</span>';
}

/* ---------- carga de datos ---------- */
async function loadData() {
  const files = ["capas", "conceptos", "situaciones", "rutas"];
  const results = await Promise.all(
    files.map((f) => fetch(`./data/${f}.json`).then((r) => r.json()))
  );
  files.forEach((f, i) => (DB[f] = results[i]));
  DB.conceptos.forEach((c) => (byId[c.id] = c));
}

/* ---------- búsqueda ---------- */
function search(q) {
  const n = norm(q).trim();
  if (!n) return { conceptos: [], situaciones: [] };
  const terms = n.split(/\s+/);
  const match = (text) => terms.every((t) => norm(text).includes(t));
  return {
    conceptos: DB.conceptos.filter((c) => match(`${c.termino} ${c.definicion} ${c.enLaPractica}`)),
    situaciones: DB.situaciones.filter((s) => match(`${s.titulo} ${s.caso} ${s.doctrina}`)),
  };
}

/* ---------- vistas ---------- */
function viewHome() {
  const layers = DB.capas
    .map(
      (c) => `
      <button class="layer-card" onclick="go('#/capa/${c.id}')">
        <span class="lc-num">${c.nivel}</span>
        <span class="lc-body"><h3>${esc(c.titulo)}</h3><p>${esc(c.resumen)}</p></span>
      </button>`
    )
    .join("");

  const rutas = DB.rutas
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

function viewCapa(id) {
  const capa = DB.capas.find((c) => c.id === id);
  if (!capa) return viewNotFound();
  const conceptos = DB.conceptos.filter((c) => c.capa === capa.nivel);
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

function viewConcepto(id) {
  const c = byId[id];
  if (!c) return viewNotFound();
  const cita =
    c.cita && (c.cita.texto || c.cita.fuente)
      ? `<div class="block"><div class="lbl">Fuente oficial</div>
          <div class="cite">${c.cita.texto ? `«${esc(c.cita.texto)}»` : "Cita textual pendiente de incorporar."}
          <div class="src">${esc(c.cita.fuente || "")}${c.cita.ubicacion ? " — " + esc(c.cita.ubicacion) : ""}</div></div></div>`
      : "";
  const rel = (c.relacionados || [])
    .map((rid) => (byId[rid] ? `<a onclick="go('#/concepto/${rid}')">${esc(byId[rid].termino)}</a>` : ""))
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

function viewSituacion(id) {
  const s = DB.situaciones.find((x) => x.id === id);
  if (!s) return viewNotFound();
  const rel = (s.conceptos || [])
    .map((rid) => (byId[rid] ? `<a onclick="go('#/concepto/${rid}')">${esc(byId[rid].termino)}</a>` : ""))
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

function viewRuta(id) {
  const r = DB.rutas.find((x) => x.id === id);
  if (!r) return viewNotFound();
  const pasos = (r.pasos || [])
    .map((pid) => (byId[pid] ? `<a class="card" onclick="go('#/concepto/${pid}')">${esc(byId[pid].termino)}</a>` : ""))
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

function viewBuscar(q) {
  const res = search(q);
  const cs = res.conceptos
    .map((c) => `<button class="card list-item" onclick="go('#/concepto/${c.id}')"><h3>${esc(c.termino)} ${draftChip(c.estado)}</h3><p>${esc(c.definicion).slice(0,100)}…</p></button>`)
    .join("");
  const ss = res.situaciones
    .map((s) => `<button class="card list-item" onclick="go('#/situacion/${s.id}')"><h3>💬 ${esc(s.titulo)}</h3></button>`)
    .join("");
  const total = res.conceptos.length + res.situaciones.length;
  return `
    <div class="view">
      <div class="search-wrap">
        <span class="si">🔍</span>
        <input type="search" autofocus value="${esc(q)}" placeholder="Buscar…" oninput="go('#/buscar/' + encodeURIComponent(this.value))" />
      </div>
      ${!q ? '<p class="empty">Escribe para buscar conceptos y situaciones.</p>' :
        total === 0 ? '<p class="empty">Sin resultados. Prueba con otra palabra.</p>' :
        `${cs ? `<p class="section-title">Conceptos</p>${cs}` : ""}${ss ? `<p class="section-title">Situaciones</p>${ss}` : ""}`}
    </div>`;
}

function viewSituaciones() {
  const items = DB.situaciones
    .map((s) => `<button class="card list-item" onclick="go('#/situacion/${s.id}')"><h3>💬 ${esc(s.titulo)} ${draftChip(s.estado)}</h3><p>${esc(s.caso).slice(0,110)}…</p></button>`)
    .join("") || '<p class="empty">Aún no hay situaciones cargadas.</p>';
  return `<div class="view"><h2 class="detail">Situaciones reales</h2><p style="color:var(--muted);margin-top:0">Casos concretos resueltos con doctrina.</p>${items}</div>`;
}

function viewNotFound() {
  return '<div class="view"><p class="empty">No encontramos eso.<br><button class="back" onclick="go(\'#/\')">← Inicio</button></p></div>';
}

/* ---------- router ---------- */
function render() {
  const hash = location.hash || "#/";
  const [, route, param] = hash.replace(/^#\//, "#/").split("/");
  let html;
  switch (route) {
    case "": html = viewHome(); break;
    case "capa": html = viewCapa(param); break;
    case "concepto": html = viewConcepto(param); break;
    case "situacion": html = viewSituacion(param); break;
    case "situaciones": html = viewSituaciones(); break;
    case "ruta": html = viewRuta(param); break;
    case "buscar": html = viewBuscar(param ? decodeURIComponent(param) : ""); break;
    default: html = viewHome();
  }
  app.innerHTML = html;
  app.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  updateTabbar(route);
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
