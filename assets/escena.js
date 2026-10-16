/* Programa Scout — escena de campamento (ambiente), módulo ES sin dependencias.
   Fogata con llamas y brasas, estrellas desfasadas y curvas de nivel que derivan.
   Solo se anima transform y opacity (en styles.css, bloque «Escena»). Con
   prefers-reduced-motion la escena queda quieta: el CSS apaga sus animaciones.
   Se pausa con la pestaña oculta y se apaga al desmontar (al salir de la vista).
   La flor de lis no forma parte de la escena: nunca se anima ni se usa de motivo. */

/* Lee la preferencia en cada llamada: el usuario puede cambiarla con la app abierta. */
export function movimientoReducido() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {
    return false;
  }
}

/* Azar con semilla: la escena es la misma en cada visita (sin saltos al volver). */
function azar(semilla) {
  let s = semilla >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const FOGATA = `
  <span class="esc-fogata">
    <span class="esc-resplandor"></span>
    <svg class="esc-fuego" viewBox="0 0 64 64" focusable="false">
      <g class="esc-llama esc-llama-afuera"><path d="M32 6c3 9 15 15 15 30a15 15 0 0 1-30 0c0-7 3-11 7-15 0 6 3 9.5 7 11-1-9.5-1.5-16.5 1-26z"/></g>
      <g class="esc-llama esc-llama-adentro"><path d="M32.5 24c2 6 8.5 9 8.5 17a8.5 8.5 0 0 1-17 0c0-4 2-6.5 4-8.5.3 3.4 1.8 5.2 4 6-.6-5.4-.8-9.6.5-14.5z"/></g>
      <g class="esc-lenos"><path d="M12 59l40-10M12 49l40 10"/></g>
    </svg>
    <span class="esc-brasa" style="--x:-7px;--d:0s;--t:1.9s"></span>
    <span class="esc-brasa" style="--x:5px;--d:.7s;--t:2.3s"></span>
    <span class="esc-brasa" style="--x:-1px;--d:1.3s;--t:2.1s"></span>
  </span>`;

/* Monta la escena dentro de `contenedor` (que debe estar posicionado) y
   devuelve la función que la desmonta. `zonas` (opcional): rectángulos en %
   [{x:[a,b], y:[a,b]}] donde caen las estrellas, para que no toquen el texto. */
export function montarEscena(contenedor, opciones = {}) {
  if (!contenedor) return () => {};
  const { fogata = true, estrellas = 12, zonas = [{ x: [4, 96], y: [4, 50] }] } = opciones;
  const r = azar(7);
  const cielo = Array.from({ length: Math.max(0, estrellas) }, (_, i) => {
    const z = zonas[i % zonas.length];
    const x = (z.x[0] + r() * (z.x[1] - z.x[0])).toFixed(1);
    const y = (z.y[0] + r() * (z.y[1] - z.y[0])).toFixed(1);
    const t = (2.8 + r() * 2.6).toFixed(2);
    const d = (-r() * 5).toFixed(2);
    const tam = i % 4 === 0 ? 3 : 2;
    const dorada = i % 5 === 2 ? " dorada" : "";
    return `<span class="esc-estrella${dorada}" style="left:${x}%;top:${y}%;--t:${t}s;--d:${d}s;--tam:${tam}px"></span>`;
  }).join("");

  const escena = document.createElement("div");
  escena.className = "escena";
  escena.setAttribute("aria-hidden", "true");
  escena.innerHTML = `<span class="esc-topo"></span>${cielo}${fogata ? FOGATA : ""}`;
  contenedor.prepend(escena);
  contenedor.classList.add("con-escena");

  const pausar = () => escena.classList.toggle("pausada", document.hidden === true);
  pausar();
  document.addEventListener("visibilitychange", pausar);

  let montada = true;
  return function desmontar() {
    if (!montada) return;
    montada = false;
    document.removeEventListener("visibilitychange", pausar);
    escena.getAnimations?.({ subtree: true }).forEach((a) => a.cancel());
    escena.remove();
    contenedor.classList.remove("con-escena");
  };
}
