/* Almacén del progreso del usuario.
   Persiste en localStorage; si no se puede escribir (modo privado, cuota,
   almacenamiento bloqueado) conserva el último estado en memoria para que
   la sesión siga funcionando. Nunca lanza excepciones. */

export const CLAVE = 'ps-progreso-v1';

const SONDA = 'ps-sonda';

// Respaldo en memoria: solo se llena cuando una escritura falla.
let memoria = null;

export function estadoInicial() {
  return { leidas: {}, situaciones: {}, parches: {}, ultima: null, sonido: false, bienvenida: false };
}

// Fusiona lo guardado con el estado inicial; lo que no sea un objeto se descarta.
function completar(crudo) {
  if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) return estadoInicial();
  return { ...estadoInicial(), ...crudo };
}

export function leer() {
  if (memoria !== null) return completar(memoria);
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto === null) return estadoInicial();
    return completar(JSON.parse(texto));
  } catch (e) {
    return estadoInicial();
  }
}

// Devuelve true si quedó persistido; si falla, lo guarda en memoria y devuelve false.
export function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    memoria = null;
    return true;
  } catch (e) {
    memoria = estado;
    return false;
  }
}

export function reiniciar() {
  memoria = null;
  try { localStorage.removeItem(CLAVE); } catch (e) { /* sin almacenamiento */ }
  return estadoInicial();
}

// Sondea con una escritura real: refleja si hoy se puede persistir.
export function disponible() {
  try {
    localStorage.setItem(SONDA, '1');
    localStorage.removeItem(SONDA);
    return true;
  } catch (e) {
    return false;
  }
}
