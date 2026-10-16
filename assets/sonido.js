/* Sonidos de la app, sintetizados con Web Audio (sin archivos de audio).
   Suaves, breves y sin sonidos de error. Reglas:
   - Nada suena ni se crea un AudioContext si el sonido está apagado.
   - El AudioContext se crea de forma perezosa y solo después de un gesto
     del usuario (política de autoplay); hay una sola instancia.
   - Ganancia maestra <= 0,25.
   - Cualquier fallo de audio se traga: nunca debe romper la app. */

const GANANCIA_MAESTRA = 0.25;

let encendido = false;
let ctx = null;
let maestra = null;
let hubo_gesto = false;
let fogataActiva = false;
let fogataNodos = null;
let fogataTimer = null;

export function configurar(activo) {
  encendido = Boolean(activo);
  if (!encendido) fogata(false);
}

export function activo() {
  return encendido;
}

/* Un gesto real habilita el audio y reanuda un contexto suspendido. */
function marcarGesto() {
  hubo_gesto = true;
  if (ctx && ctx.state === "suspended") {
    try { ctx.resume().catch(() => {}); } catch (e) { /* sin audio */ }
  }
}
["pointerdown", "touchstart", "keydown", "click"].forEach((tipo) =>
  document.addEventListener(tipo, (e) => { if (e.isTrusted) marcarGesto(); }, { capture: true, passive: true })
);

/* Crea (una vez) el contexto y la ganancia maestra. Devuelve null si no se puede. */
function contexto() {
  if (!encendido || !hubo_gesto) return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      maestra = ctx.createGain();
      maestra.gain.value = GANANCIA_MAESTRA;
      maestra.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch (e) {
    return null;
  }
}

/* Nota con ataque corto y caída exponencial. */
function nota(c, { freq, t0 = 0, dur = 0.2, pico = 0.5, tipo = "sine", fin = null }) {
  const t = c.currentTime + t0;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, t);
  if (fin) osc.frequency.exponentialRampToValueAtTime(fin, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(maestra);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function bufferRuido(c, seg) {
  const n = Math.floor(c.sampleRate * seg);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/* Golpe seco de madera: ruido filtrado + tono grave que cae. Dura ~40 ms. */
function tic(c) {
  const t = c.currentTime;
  const ruido = c.createBufferSource();
  ruido.buffer = bufferRuido(c, 0.05);
  const filtro = c.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = 1800;
  filtro.Q.value = 2;
  const g = c.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  ruido.connect(filtro);
  filtro.connect(g);
  g.connect(maestra);
  ruido.start(t);
  ruido.stop(t + 0.05);
  nota(c, { freq: 420, fin: 260, dur: 0.04, pico: 0.35, tipo: "triangle" });
}

/* Dos notas ascendentes (Do5, Mi5), ~250 ms. */
function leida(c) {
  nota(c, { freq: 523.25, t0: 0, dur: 0.13, pico: 0.4 });
  nota(c, { freq: 659.25, t0: 0.11, dur: 0.14, pico: 0.4 });
}

/* Brillo suave: dos parciales agudos con caída lenta. */
function brillo(c, t0, dur) {
  nota(c, { freq: 2093, t0, dur, pico: 0.07 });
  nota(c, { freq: 3136, t0: t0 + 0.03, dur: dur - 0.03, pico: 0.05 });
}

/* Arpegio Do-Mi-Sol + brillo, ~700 ms. */
function parche(c) {
  nota(c, { freq: 523.25, t0: 0, dur: 0.22, pico: 0.38 });
  nota(c, { freq: 659.25, t0: 0.15, dur: 0.22, pico: 0.38 });
  nota(c, { freq: 783.99, t0: 0.30, dur: 0.4, pico: 0.4 });
  brillo(c, 0.32, 0.38);
}

/* Fanfarria de cinco notas (Do-Mi-Sol-Do-Mi), ~1,2 s. */
function completo(c) {
  const f = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  f.forEach((hz, i) => nota(c, { freq: hz, t0: i * 0.17, dur: i === 4 ? 0.52 : 0.28, pico: 0.36, tipo: i === 4 ? "sine" : "triangle" }));
  nota(c, { freq: 261.63, t0: 0.68, dur: 0.52, pico: 0.2 });
  brillo(c, 0.7, 0.5);
}

function vibrar(patron) {
  try { navigator.vibrate?.(patron); } catch (e) { /* sin vibración */ }
}

export function tocar(evento) {
  if (!encendido) return;
  try {
    const c = contexto();
    if (!c) return;
    if (evento === "tic") tic(c);
    else if (evento === "leida") leida(c);
    else if (evento === "parche") { parche(c); vibrar(30); }
    else if (evento === "completo") { completo(c); vibrar([40, 60, 80]); }
  } catch (e) { /* el audio nunca rompe la app */ }
}

/* Fogata: lecho de ruido grave muy suave + chasquidos al azar. Mientras esté abierta la bienvenida. */
export function fogata(encender) {
  try {
    if (!encender) {
      fogataActiva = false;
      clearTimeout(fogataTimer);
      fogataTimer = null;
      if (fogataNodos && ctx) {
        const { fuente, g } = fogataNodos;
        g.gain.cancelScheduledValues(ctx.currentTime);
        g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
        fuente.stop(ctx.currentTime + 0.8);
      }
      fogataNodos = null;
      return;
    }
    if (fogataActiva) return;
    const c = contexto();
    if (!c) return;
    fogataActiva = true;
    const fuente = c.createBufferSource();
    fuente.buffer = bufferRuido(c, 2);
    fuente.loop = true;
    const filtro = c.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 420;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.6);
    fuente.connect(filtro);
    filtro.connect(g);
    g.connect(maestra);
    fuente.start();
    fogataNodos = { fuente, g };
    const chasquido = () => {
      if (!fogataActiva || !ctx) return;
      try {
        const t = ctx.currentTime;
        const r = ctx.createBufferSource();
        r.buffer = bufferRuido(ctx, 0.03);
        const f = ctx.createBiquadFilter();
        f.type = "highpass";
        f.frequency.value = 1500 + Math.random() * 2500;
        const gg = ctx.createGain();
        gg.gain.setValueAtTime(0.03 + Math.random() * 0.05, t);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
        r.connect(f);
        f.connect(gg);
        gg.connect(maestra);
        r.start(t);
        r.stop(t + 0.03);
      } catch (e) { /* sin audio */ }
      fogataTimer = setTimeout(chasquido, 120 + Math.random() * 520);
    };
    fogataTimer = setTimeout(chasquido, 200);
  } catch (e) { /* el audio nunca rompe la app */ }
}
