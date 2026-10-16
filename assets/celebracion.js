/* Programa Scout — celebración de logros (módulo ES, sin dependencias externas).
   · animarVisto(el): sello «Leída» que aparece y dibuja su visto en la vista actual.
   · celebrarParche(parche, {completo}): hoja desde abajo, parche que entra girando,
     puntada que se «cose» y ~30 chispas; ~2 s. Varias seguidas van en fila.
   Solo transform y opacity; la única excepción es el hilo de la puntada
   (stroke-dashoffset), que vive solo dentro de esta hoja y se apaga con
   prefers-reduced-motion. Con movimiento reducido: sin chispas, sin giro ni
   rebote; la hoja aparece quieta con su texto (fundido de 100 ms).
   El sonido no vive aquí: app.js lo toca con `alMostrar`, al aparecer cada hoja. */
import { movimientoReducido } from "./escena.js";

export { movimientoReducido };

const COLOR = /^#[0-9a-f]{6}$/i;
const RAMAS = ["#f0592b", "#ffd00f", "#016937", "#233f96", "#be2026"];
const CHISPAS = 30;
const PALETA = ["#622599", "#FFE675", "#00AFEF", "#FFE675", "#ffffff"];

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const icono = (n) => `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;

/* ---------- Ficha leída: el sello aparece y su visto se dibuja ---------- */
export function animarVisto(el) {
  if (!el || !el.isConnected) return;
  el.classList.add("sello-host");
  let sello = el.querySelector(":scope > .sello-visto");
  if (!sello) {
    sello = document.createElement("span");
    sello.className = "sello-visto";
    sello.innerHTML = `<span class="sv-check">${icono("visto")}<span class="sv-tapa"></span></span><span class="sv-txt">Leída</span>`;
    el.prepend(sello);
  }
  sello.setAttribute("role", "status");
  sello.classList.remove("animar");
  void sello.offsetWidth; // reinicia la animación si ya estaba
  sello.classList.add("animar");
}

/* ---------- Hoja del parche ---------- */
let cola = Promise.resolve();
let abierta = null; // { cerrar }
let serie = 0;

/* Encola la celebración; la promesa se cumple cuando esta hoja se cierra. */
export function celebrarParche(parche, opciones = {}) {
  const turno = cola.then(() => mostrar(parche || {}, opciones)).catch(() => {});
  cola = turno;
  return turno;
}

function figuraParche(p, n) {
  const hex = p.forma === "hexagono";
  const fondo = hex
    ? '<polygon class="pf-fondo" points="54,3 98.2,28.5 98.2,79.5 54,105 9.8,79.5 9.8,28.5"/>'
    : '<circle class="pf-fondo" cx="54" cy="54" r="51"/>';
  const forma = hex ? 'polygon points="54,12 90.4,33 90.4,75 54,96 17.6,75 17.6,33"' : 'circle cx="54" cy="54" r="42"';
  const etiqueta = hex ? "polygon" : "circle";
  return `<svg class="pf" viewBox="0 0 108 108" aria-hidden="true" focusable="false">
      <defs><mask id="hp-hilo-${n}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="128" height="128">
        <${forma} class="hp-hilo" pathLength="100" fill="none" stroke="#fff" stroke-width="9"></${etiqueta}>
      </mask></defs>
      ${fondo}
      <${forma} class="pf-puntada" mask="url(#hp-hilo-${n})"></${etiqueta}>
      <use class="pf-simbolo" href="#i-${esc(p.simbolo || "brujula")}" x="31" y="31" width="46" height="46"/>
    </svg>`;
}

function panal(color) {
  return `<span class="hp-panal" aria-hidden="true">${RAMAS.map((c, i) =>
    `<span class="hp-hex${c.toLowerCase() === String(color).toLowerCase() ? " propia" : ""}" style="--c:${c};--i:${i}"></span>`).join("")}</span>`;
}

/* ~30 chispas desde el centro del parche, con ángulo, distancia y giro propios. */
function soltarChispas(destino) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < CHISPAS; i++) {
    const ang = (i / CHISPAS) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 80 + Math.random() * 90;
    const s = document.createElement("span");
    s.className = "chispa" + (i % 3 === 0 ? " rombo" : "");
    s.style.cssText =
      `--dx:${(Math.cos(ang) * dist).toFixed(1)}px;--dy:${(Math.sin(ang) * dist * 0.8 - 30).toFixed(1)}px;` +
      `--r:${Math.round((Math.random() - 0.5) * 540)}deg;--t:${Math.round(850 + Math.random() * 450)}ms;` +
      `--d:${Math.round(Math.random() * 120)}ms;background:${PALETA[i % PALETA.length]}`;
    frag.appendChild(s);
  }
  destino.appendChild(frag);
  // Se retiran solas: la más larga dura 1,3 s más su retardo.
  setTimeout(() => destino.replaceChildren(), 1600);
}

function mostrar(p, { completo = false, etiqueta, alMostrar } = {}) {
  return new Promise((resolver) => {
    const n = ++serie;
    const quieta = movimientoReducido();
    const previo = document.activeElement;
    const color = COLOR.test(p.color) ? p.color : "#622599";
    const texto = COLOR.test(p.texto) ? p.texto : "#ffffff";
    const eyebrow = etiqueta || (completo ? "Rama completa" : "Parche ganado");
    const mensaje = p.mensaje || "Quedó cosido en tu Mochila.";

    const raiz = document.createElement("div");
    raiz.className = `hoja-parche${completo ? " completo" : ""}${quieta ? " quieta" : ""}`;
    raiz.setAttribute("role", "dialog");
    raiz.setAttribute("aria-modal", "true");
    raiz.setAttribute("aria-labelledby", `hp-titulo-${n}`);
    raiz.innerHTML = `
      <div class="hp-velo"></div>
      <div class="hp-hoja">
        <span class="hp-fondo" aria-hidden="true"><span class="hp-topo"></span></span>
        <div class="hp-escenario">
          ${completo ? '<span class="hp-rayos" aria-hidden="true"></span>' : ""}
          <span class="hp-parche ganado" style="--p-color:${color};--p-texto:${texto}">${figuraParche(p, n)}</span>
          <span class="hp-chispas" aria-hidden="true"></span>
        </div>
        <p class="hp-eyebrow">${esc(eyebrow)}</p>
        <h2 class="hp-titulo" id="hp-titulo-${n}">${esc(p.titulo)}</h2>
        <p class="hp-texto" aria-live="polite"></p>
        ${completo ? panal(color) : ""}
        <button class="hp-seguir" type="button">Seguir</button>
      </div>`;

    // Lo de atrás queda inerte mientras la hoja esté abierta.
    const fondo = [document.querySelector(".app-header"), document.getElementById("app"), document.querySelector(".tabbar")]
      .filter((el) => el && !el.inert);
    fondo.forEach((el) => { el.inert = true; });
    document.body.appendChild(raiz);
    const boton = raiz.querySelector(".hp-seguir");
    boton.focus({ preventScroll: true });
    // La región viva recibe su texto ya montada, para que se anuncie.
    requestAnimationFrame(() => { raiz.querySelector(".hp-texto").textContent = mensaje; });
    try { alMostrar?.(); } catch (e) { /* el sonido nunca rompe la hoja */ }

    let chispas = null;
    if (!quieta) chispas = setTimeout(() => soltarChispas(raiz.querySelector(".hp-chispas")), 780);

    let cerrada = false;
    const cerrar = () => {
      if (cerrada) return;
      cerrada = true;
      clearTimeout(chispas);
      document.removeEventListener("keydown", teclas, true);
      window.removeEventListener("hashchange", cerrar);
      abierta = null;
      raiz.classList.add("saliendo");
      const fin = () => {
        raiz.remove();
        fondo.forEach((el) => { el.inert = false; });
        if (previo && previo.isConnected && typeof previo.focus === "function") previo.focus({ preventScroll: true });
        resolver();
      };
      setTimeout(fin, movimientoReducido() ? 100 : 180);
    };
    const teclas = (e) => {
      if (e.key === "Escape") { e.preventDefault(); cerrar(); }
      else if (e.key === "Tab") { e.preventDefault(); boton.focus({ preventScroll: true }); }
    };
    document.addEventListener("keydown", teclas, true);
    raiz.addEventListener("click", cerrar);
    // Navegar a otra vista cierra la hoja (la fila sigue con la próxima).
    window.addEventListener("hashchange", cerrar);
    abierta = { cerrar };
  });
}

/* Para pruebas y para la Bienvenida: cierra la hoja abierta, si hay. */
export function cerrarCelebracion() {
  abierta?.cerrar();
}
