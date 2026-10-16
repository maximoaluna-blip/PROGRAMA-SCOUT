# Rediseño visual de Programa Scout — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a la PWA el sistema visual «parche y panal» con toques de campamento, movimiento, sonido sintetizado y progreso con 13 parches, sin tocar el contenido.

**Architecture:** PWA estática sin build. `assets/app.js` se parte en módulos ES nativos con una responsabilidad cada uno; la lógica de progreso es pura (sin DOM) y se prueba cargándola en el navegador con `import()`. Estado del usuario solo en `localStorage` (`ps-progreso-v1`).

**Tech Stack:** HTML/CSS/JS vanilla (módulos ES), SVG en línea, Web Audio API, IntersectionObserver; pruebas Playwright + `@axe-core/playwright` en `PRUEBAS-E2E/`.

**Spec:** `docs/superpowers/specs/2026-10-16-rediseno-visual-design.md` (leerlo antes de cada tarea; las tablas de color, sonido y parches salen de ahí).

## Global Constraints

- Trabajo **solo en la rama `rediseno-visual`**. **Nunca** push a `main` (publica). Push de la rama permitido.
- Sin librerías ni dependencias nuevas en la app; sin build; sin archivos de audio.
- Solo `transform` y `opacity` en animaciones. Todo lo animado tiene su variante en `@media (prefers-reduced-motion: reduce)`: sin ambiente, rebotes ni chispas; fundidos de 100 ms.
- La flor de lis (`icons/icon.svg`) **no se anima** ni se usa como motivo decorativo. Sin imágenes generadas por IA.
- Colores exactos de la tabla del spec §2.1; Familia y Manada nunca como color de texto sobre blanco.
- `AudioContext` solo tras gesto del usuario y solo con sonido activo; ganancia maestra ≤ 0,25.
- No cambia ningún texto doctrinal de `data/conceptos.json`, `situaciones.json`, `rutas.json`, `capas.json`.
- Selectores que la suite actual usa y deben **conservarse**: `.layer-card`, `.list-item`, `.detail h2`, `#q-input`, `#search-results`, `#search-results .empty`, `.tabbar`, `.tabbar a`, `#theme-btn`, `link[rel=manifest]`, `link[rel=apple-touch-icon]`.
- Cada tarea termina con `cd PRUEBAS-E2E && npx playwright test` en verde y un commit con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Al cambiar archivos servidos, subir `CACHE_VERSION` en `sw.js` y añadir los archivos nuevos a `APP_SHELL` (una sola vez por tarea que agregue archivos).
- Español en la interfaz; tú/«tu avance»; sin signos de exclamación en textos de sistema.

## Review Focus

1. **Primera visita en las pruebas existentes:** con la Bienvenida, toda prueba que abre `./` caería en ella. Expectativa: las pruebas viejas siguen entrando a Inicio. → Task 1 crea `tests/_base.js` que marca `bienvenida: true` antes de cada prueba; Task 9 prueba la primera visita sin él.
2. **`localStorage` bloqueado o lleno** (modo privado iPhone): la app no debe romperse ni perder la navegación. → Task 3 (unitaria con `setItem` que lanza) y Task 6 (E2E con aviso en Mochila).
3. **JSON guardado corrupto o de otra versión** (`ps-progreso-v1` con basura): se ignora y se arranca de cero sin error. → Task 3.
4. **Ficha leída dos veces / parche ya ganado:** no repite animación, sonido ni fecha. → Task 4 (`nueva: false`, fecha original) y Task 6.
5. **Ruta que crece después de ganar su parche:** el parche se conserva y la ruta muestra «hay una ficha nueva». → Task 4 y Task 6.

---

### Task 1: Partir `app.js` en módulos sin cambio visual

**Files:**
- Create: `assets/vistas.js`, `PRUEBAS-E2E/tests/_base.js`
- Modify: `assets/app.js`, `index.html:36`, `sw.js:4-15`, los 6 specs de `PRUEBAS-E2E/tests/`

**Interfaces:**
- Produces: `assets/vistas.js` exporta `vistaInicio(ctx)`, `vistaCapa(ctx, id)`, `vistaConcepto(ctx, id)`, `vistaSituacion(ctx, id)`, `vistaRuta(ctx, id)`, `vistaBuscar(ctx, q)`, `resultadosBusqueda(ctx, q)`, `vistaSituaciones(ctx)`, `vistaNoEncontrada()`, todas `→ string` (HTML). `ctx = { db: {capas, conceptos, situaciones, rutas, parches}, byId, estado }` (`parches` y `estado` vacíos hasta Tasks 4–6).
- Produces: `tests/_base.js` exporta `test` y `expect` (extendidos de `@playwright/test`) cuyo `page` ejecuta antes de cada prueba `localStorage.setItem('ps-progreso-v1', JSON.stringify({bienvenida:true, sonido:false}))` vía `addInitScript`.

- [ ] **Step 1:** Cambiar el `require('@playwright/test')` de los 6 specs por `require('./_base')`; crear `_base.js`. Run: `npx playwright test` → 42 passed.
- [ ] **Step 2:** Mover las funciones `view*` de `app.js` a `vistas.js` como exportaciones con la firma de arriba (mismo HTML); `app.js` queda con datos, búsqueda, enrutador, tema y registro del SW; `index.html` carga `<script type="module" src="./assets/app.js">`. Los `onclick="go(...)"` siguen funcionando porque `app.js` asigna `window.go`.
- [ ] **Step 3:** `sw.js`: añadir `./assets/vistas.js` a `APP_SHELL`; `CACHE_VERSION` → `programa-scout-v13`.
- [ ] **Step 4:** Run: `npx playwright test` → 42 passed.
- [ ] **Step 5:** Commit `Rediseño T1: app.js en módulos ES (vistas.js), base de pruebas; sin cambio visual`.

### Task 2: Sistema visual, sprite de íconos y ficha

**Files:**
- Create: `assets/tokens.css`
- Modify: `assets/styles.css` (reescritura), `index.html` (sprite en línea, barra de 4 pestañas, botón `#sonido-btn` oculto hasta Task 7), `assets/vistas.js` (`vistaConcepto`, `vistaSituacion`), `sw.js`
- Test: `PRUEBAS-E2E/tests/visual.spec.js` (nuevo), `a11y.spec.js`

**Interfaces:**
- Produces: sprite `<svg hidden><symbol id="i-{nombre}">` con los 17 nombres del spec §2.3: `brujula libro panal nudo carpa fogata mapa huella lupa dialogo mochila casa altavoz altavoz-off tema visto flecha`. Uso: `<svg class="ico"><use href="#i-brujula"/></svg>`.
- Produces: helper en `vistas.js` `icono(nombre: string) → string`.
- Produces: variables CSS de `tokens.css` con los nombres del spec §2.1 más `--rama-{cachorros|lobatos|scouts|nomadas-scout|rovers}` y `--rama-{…}-texto`, `--capa-{0..3}` y `--capa-{0..3}-texto`. Clase `data-rama="{id}"` / `data-capa="{n}"` en la raíz de cada vista de ficha para teñir cinta y chip.
- Produces: en la ficha, el bloque de fuente es `<section class="fuente">` y es **el último hijo** de `.detail`; «En la práctica» es `.practica` con borde de puntada.

- [ ] **Step 1: Pruebas que fallan** en `visual.spec.js`:
  - `la barra inferior usa íconos SVG del sprite`: `.tabbar a` cuenta 4; cada uno contiene `svg use[href^="#i-"]`; ningún texto de la barra contiene emoji (`/\p{Extended_Pictographic}/u` no hace match en `innerText`).
  - `la ficha termina en su fuente oficial`: en `./#/concepto/metodo-scout`, `.detail > :last-child` tiene clase `fuente` y su texto no está vacío.
  - `la ficha de rama se tiñe con su color`: en `./#/concepto/manada-lobatos`, `.detail[data-rama="lobatos"]` existe y el `background-color` computado de `.detail .cinta` es `rgb(255, 208, 15)`.
  - En `a11y.spec.js` añadir a `VISTAS` `{ nombre: 'concepto-rama', hash: './#/concepto/manada-lobatos' }` y `{ nombre: 'situacion', hash: './#/situacion/actividades-sin-rumbo' }` (esperas `.detail h2`).
- [ ] **Step 2:** Run `npx playwright test visual a11y` → FAIL (sin sprite, sin `.fuente`).
- [ ] **Step 3:** Implementar tokens, sprite (trazo 2 px, `currentColor`, caja 24×24), estilos de cabecera/tarjeta/chip/puntada y la ficha y situación nuevas según spec §2 y §3.4/§3.6. Modo oscuro = `--night` con capa de estrellas estática (CSS, sin animar aún). `sw.js`: añadir `tokens.css`, versión v14.
- [ ] **Step 4:** Run `npx playwright test` → todo verde (las 42 + nuevas).
- [ ] **Step 5:** Commit `Rediseño T2: tokens, sprite de íconos, ficha y situación con fuente destacada`.

### Task 3: `almacen.js`

**Files:**
- Create: `assets/almacen.js`, `PRUEBAS-E2E/tests/almacen.spec.js`

**Interfaces:**
- Produces: `CLAVE = 'ps-progreso-v1'`; `estadoInicial() → Estado` con `{leidas:{}, situaciones:{}, parches:{}, ultima:null, sonido:false, bienvenida:false}`; `leer() → Estado` (fusiona con `estadoInicial()`; JSON inválido o no-objeto → `estadoInicial()`); `guardar(estado: Estado) → boolean` (false si falla y entonces guarda en memoria); `reiniciar() → Estado`; `disponible() → boolean`.

- [ ] **Step 1: Pruebas que fallan** (en el navegador: `page.goto('./')` y `page.evaluate(async () => { const m = await import('./assets/almacen.js'); … })`):
  - `guarda y lee el estado`: `guardar({...estadoInicial(), leidas:{a:'2026-10-16'}})` → `true`; `leer().leidas.a === '2026-10-16'`.
  - `JSON corrupto arranca de cero`: con `localStorage['ps-progreso-v1']='{no json'`, `leer()` deep-equals `estadoInicial()`.
  - `estado parcial se completa`: con `'{"leidas":{"a":"x"}}'`, `leer().parches` deep-equals `{}` y `leer().leidas.a === 'x'`.
  - `almacenamiento bloqueado`: con `addInitScript` que hace `Storage.prototype.setItem = () => { throw new Error('QuotaExceeded') }`, `guardar(...)` → `false`, `disponible()` → `false`, y `leer()` devuelve lo último guardado en memoria.
  - `reiniciar borra solo su clave`: con `ps-theme='dark'` presente, tras `reiniciar()` `localStorage['ps-theme'] === 'dark'` y `localStorage['ps-progreso-v1']` es `null`.
- [ ] **Step 2:** Run `npx playwright test almacen` → FAIL (módulo inexistente).
- [ ] **Step 3:** Implementar con las firmas de arriba; `try/catch` en todo acceso a `localStorage`.
- [ ] **Step 4:** Run `npx playwright test` → verde.
- [ ] **Step 5:** `sw.js` añade `almacen.js`, v15. Commit `Rediseño T3: almacen.js con respaldo en memoria`.

### Task 4: `progreso.js` y `data/parches.json`

**Files:**
- Create: `assets/progreso.js`, `data/parches.json`, `PRUEBAS-E2E/tests/progreso.spec.js`
- Modify: `PRUEBAS-E2E/tests/data.spec.js`, `assets/app.js` (carga `parches.json` en `DB.parches`), `sw.js`

**Interfaces:**
- Consumes: forma `Estado` de Task 3.
- Produces (funciones puras, devuelven estado nuevo, nunca mutan):
  - `marcarLeida(estado, tipo: 'concepto'|'situacion', id: string, fecha: string) → { estado, nueva: boolean }` (si ya estaba, `nueva:false` y fecha original intacta).
  - `idsDeCriterio(parche, db) → string[]` y `tipoDeCriterio(parche) → 'concepto'|'situacion'` (ruta → sus `pasos`; `situaciones:'todas'` → ids de situaciones; `conceptos:'todos'` → ids de conceptos).
  - `avance(estado, ids: string[], tipo) → { leidas: number, total: number }`.
  - `avanceCapa(estado, db, capa: number) → {leidas,total}`; `avanceRama(estado, db, rama: string) → {leidas,total}`.
  - `ganarParches(estado, db, fecha) → { estado, nuevos: Parche[] }` (gana los completos aún no ganados; los ya ganados no se tocan).
  - `rutaCrecio(estado, db, rutaId) → boolean` (parche ganado y `avance` < total).
  - `fichaDelDia(conceptos, fecha: 'YYYY-MM-DD') → Concepto` sobre los `estado==='auditado'`, índice `h % n` con `h = 0; for (const c of fecha) h = (h * 31 + c.charCodeAt(0)) >>> 0`.
- Produces: `data/parches.json` con 13 objetos `{id, titulo, criterio, color, texto, simbolo, forma}`: los 11 de ruta (`id` = id de la ruta; `titulo` = título de la ruta sin el paréntesis final; `forma:'hexagono'` y color/texto de rama para las 5 `conoce-*`, `forma:'circulo'` y color de capa para el resto; `simbolo` = símbolo de su capa), `lector-de-situaciones` y `bitacora-completa` exactamente como en spec §5.2.

- [ ] **Step 1: Pruebas que fallan** en `progreso.spec.js` (vía `import('./assets/progreso.js')` y los JSON de `./data/` con `fetch`):
  - `marcar dos veces no cambia la fecha`: primera `nueva:true`; segunda con otra fecha `nueva:false` y `leidas[id]` = la primera.
  - `completar una ruta gana su parche una sola vez`: marcar los 4 pasos de `conoce-rovers` → `ganarParches` devuelve `nuevos` con id `conoce-rovers`; segunda llamada → `nuevos.length === 0`.
  - `el parche sobrevive si la ruta crece`: tras ganarlo, añadir un id a `pasos` de una copia del db → `estado.parches['conoce-rovers']` sigue y `rutaCrecio` → `true`.
  - `situaciones y bitácora`: marcar las 7 situaciones gana `lector-de-situaciones`; marcar los 77 conceptos gana `bitacora-completa` y los 11 de ruta.
  - `ficha del día es estable`: dos llamadas con `'2026-10-16'` dan el mismo id; el resultado tiene `estado === 'auditado'`.
  - `no muta la entrada`: `Object.isFrozen`-style: congelar el estado de entrada con un deep-freeze y comprobar que ninguna función lanza.
- [ ] **Step 2:** En `data.spec.js` añadir `parches.json válido`: 13 elementos, ids únicos; cada `criterio.ruta` existe en `rutas.json`; cada ruta tiene un parche; `color` y `texto` con contraste ≥ 4,5:1 (función de luminancia relativa WCAG en el propio spec).
- [ ] **Step 3:** Run `npx playwright test progreso data` → FAIL.
- [ ] **Step 4:** Implementar `progreso.js` y escribir `parches.json`.
- [ ] **Step 5:** Run `npx playwright test` → verde. `sw.js` añade `progreso.js` y `data/parches.json`, v16. Commit `Rediseño T4: progreso.js puro y 13 parches`.

### Task 5: Pantallas Inicio, Capa (panal), Ruta (sendero), Buscar y Mochila

**Files:**
- Modify: `assets/vistas.js`, `assets/styles.css`, `assets/app.js` (ruta `#/mochila`, pastilla de la barra), `index.html`
- Test: `PRUEBAS-E2E/tests/pantallas.spec.js` (nuevo), `a11y.spec.js`, `responsive.spec.js`

**Interfaces:**
- Consumes: `avance`, `avanceCapa`, `avanceRama`, `fichaDelDia`, `rutaCrecio`, `idsDeCriterio` (Task 4); `ctx.estado` (por ahora `estadoInicial()`).
- Produces: `vistaMochila(ctx) → string`. Marcado estable que usan Tasks 6–9: `.bitacora-barra[data-leidas][data-total]`, `.layer-card[data-capa] .anillo[data-pct]`, `.ficha-dia`, `.sigue-donde`, `.panal .hex-rama[data-rama]`, `.sendero .paso[data-id]` (+ `.leido`), `.aviso-ruta-nueva`, `.parche[data-id]` (+ `.ganado`), `.aviso-almacen`, `#reiniciar-avance`.

- [ ] **Step 1: Pruebas que fallan** en `pantallas.spec.js`:
  - `inicio muestra bitácora, capas y ficha del día`: `.bitacora-barra` con `data-total="77"`; 4 `.layer-card`; `.ficha-dia` con un enlace a `#/concepto/`.
  - `la capa 2 es un panal de 5 ramas`: en `./#/capa/ramas`, 5 `.panal .hex-rama`; clic en `[data-rama="lobatos"]` muestra fichas con `data-rama="lobatos"`.
  - `la ruta es un sendero`: en `./#/ruta/conoce-rovers`, 4 `.sendero .paso`.
  - `la mochila lista 13 parches`: en `./#/mochila`, 13 `.parche`, 0 `.parche.ganado`, `#reiniciar-avance` visible; la pestaña Mochila está `.active`.
  - Buscar: el término aparece dentro de `<mark>` en `#search-results`.
  - `a11y.spec.js`: añadir vistas `capa-ramas` (`./#/capa/ramas`), `ruta` (`./#/ruta/conoce-rovers`), `mochila` (`./#/mochila`).
- [ ] **Step 2:** Run `npx playwright test pantallas a11y` → FAIL.
- [ ] **Step 3:** Implementar según spec §3.2, §3.3, §3.5, §3.7, §3.8 (Mochila: silueta gris con «N de M fichas» para pendientes; avance por capa y rama).
- [ ] **Step 4:** Run `npx playwright test` → verde. Revisar a 375 px con `responsive.spec.js` sin desbordes horizontales (añadir aserción `document.documentElement.scrollWidth <= innerWidth` en `#/`, `#/capa/ramas`, `#/mochila`).
- [ ] **Step 5:** Commit `Rediseño T5: Inicio, panal de ramas, sendero, búsqueda resaltada y Mochila`.

### Task 6: Progreso conectado (lectura, parches, avisos)

**Files:**
- Modify: `assets/app.js`, `assets/vistas.js`
- Test: `PRUEBAS-E2E/tests/progreso-e2e.spec.js` (nuevo)

**Interfaces:**
- Consumes: `leer/guardar/reiniciar/disponible` (Task 3), `marcarLeida/ganarParches` (Task 4), marcado de Task 5.
- Produces: en `app.js`, `alLeer(tipo, id) → Parche[]` (marca, guarda, gana parches y devuelve los nuevos; Tasks 7–8 se cuelgan de aquí) y el evento `document.dispatchEvent(new CustomEvent('ps:leida', {detail:{tipo,id,nueva}}))` y `'ps:parche'` con `detail:{parche, completo:boolean}` (`completo` = el parche es de rama, `bitacora-completa` o completa una capa). `IntersectionObserver` (umbral 0,6) sobre `.fuente` en ficha y sobre el último `.block` en situación. `estado.ultima` se actualiza al abrir una ficha desde `#/ruta/{id}` (con `?paso=n` en el hash de la ficha: `#/concepto/{id}?ruta={rutaId}&paso={n}`). El enrutador separa la consulta (`?…`) del parámetro antes de buscar el id, y la ficha abierta así muestra `.siguiente-en-ruta` con el enlace al paso n+1 (o a la ruta si era el último).

- [ ] **Step 1: Pruebas que fallan:**
  - `leer hasta la fuente marca la ficha`: abrir `./#/concepto/metodo-scout`, `scrollIntoView` de `.fuente`, esperar; volver a `#/capa/transversal` → el `.list-item` de `metodo-scout` tiene `.leida`; `.bitacora-barra[data-leidas="1"]` en Inicio.
  - `abrir sin bajar no cuenta`: con viewport 375×300, abrir una ficha larga y salir sin scroll → `data-leidas="0"`.
  - `completar conoce-rovers gana el parche`: recorrer sus 4 pasos bajando a la fuente → en `#/mochila`, `.parche[data-id="conoce-rovers"].ganado` con fecha visible; se recibió un `ps:parche`.
  - `no se repite la celebración`: releer una ficha ya leída → no se dispara `ps:leida` con `nueva:true` (escuchar en `addInitScript`).
  - `ruta que creció`: con `addInitScript` que siembra `parches:{'conoce-rovers':'2026-10-01'}` y `leidas` de solo 3 de sus 4 pasos → `#/ruta/conoce-rovers` muestra `.aviso-ruta-nueva` y la Mochila lo sigue mostrando `.ganado`.
  - `almacenamiento bloqueado`: con `setItem` que lanza → se puede leer una ficha y navegar sin errores en consola (`page.on('pageerror')` vacío) y `#/mochila` muestra `.aviso-almacen`.
  - `reiniciar`: tras ganar un parche, `#reiniciar-avance` + confirmar (`page.once('dialog', d => d.accept())`) → 0 `.ganado`, `data-leidas="0"`.
  - `sigue donde ibas`: abrir paso 2 de `por-que-educamos` (`educacion-no-formal`) → en Inicio `.sigue-donde` enlaza a esa ruta y menciona el paso 2.
  - `siguiente en la ruta`: `./#/concepto/proposito-del-movimiento?ruta=por-que-educamos&paso=1` muestra la ficha y `.siguiente-en-ruta` enlaza a `educacion-no-formal`.
  - `ficha del día nueva para ti`: en Inicio `.ficha-dia` tiene `.nueva`; tras leerla, ya no.
- [ ] **Step 2:** Run `npx playwright test progreso-e2e` → FAIL.
- [ ] **Step 3:** Implementar. Confirmación de reinicio con `confirm('¿Borrar tu avance en este teléfono?')`.
- [ ] **Step 4:** Run `npx playwright test` → verde.
- [ ] **Step 5:** Commit `Rediseño T6: lectura real, parches ganados, ruta que crece, reinicio`.

### Task 7: `sonido.js`

**Files:**
- Create: `assets/sonido.js`, `PRUEBAS-E2E/tests/sonido.spec.js`
- Modify: `assets/app.js` (`#sonido-btn` visible en cabecera, suscripción a `ps:leida`/`ps:parche`, tic en `.layer-card`, `.list-item` y `.tabbar a`), `index.html`, `sw.js`

**Interfaces:**
- Consumes: `estado.sonido` (Task 3), eventos de Task 6.
- Produces: `configurar(activo: boolean) → void`; `activo() → boolean`; `tocar(evento: 'tic'|'leida'|'parche'|'completo') → void` (no hace nada si inactivo); `fogata(encender: boolean) → void`. El `AudioContext` se crea dentro del primer `tocar`/`fogata` llamado desde un gesto, solo si `activo()`. Envolventes y notas: libre, respetando duraciones de spec §4.2 y ganancia maestra 0,25. `vibrar()` interno al tocar `'parche'`/`'completo'` si existe `navigator.vibrate`.

- [ ] **Step 1: Pruebas que fallan** (contar construcciones con `addInitScript` que envuelve `window.AudioContext`/`webkitAudioContext` y suma `window.__ctx++`):
  - `sin sonido no se crea AudioContext`: `sonido:false`, navegar y tocar 3 tarjetas → `__ctx === 0`.
  - `con sonido se crea al primer toque, no antes`: `sonido:true`; tras cargar `__ctx === 0`; tras clic en un `.layer-card` `__ctx === 1`; más clics no crean otro.
  - `el botón de la cabecera alterna y persiste`: clic en `#sonido-btn` → `aria-pressed` cambia y `JSON.parse(localStorage['ps-progreso-v1']).sonido` cambia; tras recargar, el estado se mantiene.
- [ ] **Step 2:** Run `npx playwright test sonido` → FAIL.
- [ ] **Step 3:** Implementar. `#sonido-btn` con `aria-label="Sonido"` y `aria-pressed`, ícono `altavoz`/`altavoz-off`.
- [ ] **Step 4:** Run `npx playwright test` → verde. `sw.js` añade `sonido.js`, v17.
- [ ] **Step 5:** Commit `Rediseño T7: sonidos sintetizados con Web Audio e interruptor`.

### Task 8: Movimiento: escena, celebración y transiciones

**Files:**
- Create: `assets/escena.js`, `assets/celebracion.js`, `PRUEBAS-E2E/tests/movimiento.spec.js`
- Modify: `assets/styles.css`, `assets/app.js`, `assets/vistas.js`, `sw.js`

**Interfaces:**
- Consumes: `ps:leida`, `ps:parche` (Task 6); `tocar` (Task 7).
- Produces: `montarEscena(contenedor: HTMLElement, opciones: {fogata: boolean, estrellas: number}) → () => void` (devuelve desmontar; pausa con `visibilitychange`). `celebrarParche(parche, {completo: boolean}) → Promise<void>` (hoja `.hoja-parche` con `role="dialog"`, `aria-live="polite"`, cerrable con toque o Escape, foco devuelto al cerrar). `animarVisto(el: HTMLElement) → void`. `movimientoReducido() → boolean` (lee `matchMedia('(prefers-reduced-motion: reduce)')` en cada llamada).

- [ ] **Step 1: Pruebas que fallan:**
  - `ganar un parche muestra la hoja y se cierra`: sembrar 3 de 4 pasos de `conoce-rovers`, leer el cuarto → `.hoja-parche` visible con el título del parche; `Escape` → oculta; el foco vuelve a la página.
  - `movimiento reducido: sin chispas ni ambiente`: con `page.emulateMedia({ reducedMotion: 'reduce' })`, ganar el parche → `.hoja-parche` visible y `.chispa` cuenta 0; en Inicio, `getAnimations()` de los nodos de `.escena` devuelve 0 animaciones en curso.
  - `con movimiento: hay chispas y ambiente`: sin emulación → `.chispa` cuenta entre 20 y 40; la escena de Inicio tiene animaciones en curso.
  - `la flor de lis no se anima`: `img.logo` y cualquier `[src$="icon.svg"]` → `getAnimations().length === 0` y `animation-name` computado `none`.
- [ ] **Step 2:** Run `npx playwright test movimiento` → FAIL.
- [ ] **Step 3:** Implementar ambiente (Inicio: cabecera), navegación (entrada de vista, cascada de 40 ms, rebote al tocar, pastilla de la barra), logro (visto, hoja, chispas 30) según spec §4.1. Duraciones: navegación 150–250 ms; hoja ~2 s.
- [ ] **Step 4:** Run `npx playwright test` → verde (a11y incluido: la hoja abierta no rompe AA). `sw.js` añade los dos módulos, v18.
- [ ] **Step 5:** Commit `Rediseño T8: escena de campamento, celebración de parches y transiciones`.

### Task 9: Bienvenida

**Files:**
- Modify: `assets/vistas.js` (`vistaBienvenida(ctx)`), `assets/app.js` (redirección de primera visita, enlace «Acerca de»), `assets/styles.css`
- Test: `PRUEBAS-E2E/tests/bienvenida.spec.js` (nuevo; usa `@playwright/test` directo, **no** `_base.js`), `a11y.spec.js`

**Interfaces:**
- Consumes: `montarEscena` (Task 8), `configurar`/`fogata` (Task 7), `leer`/`guardar` (Task 3).
- Produces: ruta `#/bienvenida`; `#sonido-toggle` (`role="switch"`, `aria-checked`), `#empezar`. Texto fijo de las tres frases: «Consulta el Programa de Jóvenes: aquí no se certifica, se aclara.», «Todo lo que ves tiene su fuente oficial.», «Tu avance queda guardado en este teléfono.»

- [ ] **Step 1: Pruebas que fallan:**
  - `la primera visita abre la bienvenida`: contexto limpio, `goto('./')` → hash `#/bienvenida`, escena visible, `#sonido-toggle[aria-checked="false"]`.
  - `empezar guarda y no vuelve a aparecer`: activar `#sonido-toggle`, clic `#empezar` → hash `#/`; `ps-progreso-v1` tiene `bienvenida:true, sonido:true`; recargar → sigue en `#/`.
  - `un enlace profundo en primera visita respeta el destino`: contexto limpio, `goto('./#/concepto/metodo-scout')` → muestra la ficha (no redirige) — la bienvenida solo intercepta `#/` vacío.
  - `«Acerca de» la vuelve a abrir`: desde Inicio, enlace `a[href="#/bienvenida"]` existe.
  - `a11y.spec.js`: vista `bienvenida` (`./#/bienvenida`), claro y oscuro.
- [ ] **Step 2:** Run `npx playwright test bienvenida a11y` → FAIL.
- [ ] **Step 3:** Implementar según spec §3.1; la fogata suena solo si el sonido está activo y tras el toque en el interruptor.
- [ ] **Step 4:** Run `npx playwright test` → verde.
- [ ] **Step 5:** Commit `Rediseño T9: bienvenida con escena y elección de sonido`.

### Task 10: Presupuesto de peso, documentación y entrega para revisión

**Files:**
- Create: `PRUEBAS-E2E/tests/peso.spec.js`
- Modify: `README.md`, `ESQUEMA-CONTENIDO.md` (sección `data/parches.json`), `CLAUDE.md` del app (§2 arquitectura: módulos; ⚠️ selectores que usa la suite y `_base.js`), `sw.js`

- [ ] **Step 1:** `peso.spec.js` `@solo-escritorio`: suma los bytes de cada entrada de `APP_SHELL` que empiece por `./assets/` más `./data/parches.json` (vía `request.get`) → `≤ 120 * 1024`. Run → PASS (si falla, reducir antes de seguir).
- [ ] **Step 2:** Documentación: README §Estado y §Arquitectura; ESQUEMA-CONTENIDO con el modelo de `parches.json` del spec §5.2; CLAUDE.md del app solo con reglas (sin cifras de estado).
- [ ] **Step 3:** Run `npx playwright test` completo → todo verde; anotar el conteo.
- [ ] **Step 4:** Capturas a 375×812 en claro y oscuro de Bienvenida, Inicio, panal, ficha, sendero, Mochila y la hoja de parche (con `page.screenshot` a la carpeta de scratchpad, no al repo) y una grabación corta (`video: 'on'` en una corrida puntual) para el dueño.
- [ ] **Step 5:** Commit `Rediseño T10: presupuesto de peso y documentación`; push de la rama `rediseno-visual` (no de `main`).
- [ ] **Step 6:** **Detenerse.** Publicar es decisión de Máximo (merge a `main`, verificación en vivo, ADR en la raíz y bitácora).
