# Rediseño visual de Programa Scout — diseño

> **Fecha:** 2026-10-16 · **Estado:** propuesto, pendiente de revisión del dueño · **Rama:** `rediseno-visual`
> Aprobado por secciones en conversación con Máximo (15/10/2026). Este documento lo consolida; la implementación empieza solo tras su aprobación y la del plan.

## 1. Objetivo y alcance

**Qué se busca (palabras del dueño):** que la app deje de ser plana y sea atractiva e impactante, con colores y simbología scout, movimiento y sonido; divertida, pero que transmita formalidad y confianza. Debe lograr **dos cosas**: una primera impresión de impacto y que el dirigente **vuelva**.

**Decisiones tomadas:**

| Tema | Decisión |
|---|---|
| Objetivo | Impacto inicial **y** retorno (progreso con parches) |
| Dirección visual | **Parche y panal** como sistema, con **toques de campamento** (portada nocturna con fogata) y la **fuente visible** de una guía de campo |
| Sonido | Se **pregunta en la Bienvenida**; luego interruptor en la cabecera |
| Ícono / flor de lis | **Se mantiene el ícono actual.** No se anima ni se usa como motivo decorativo |
| Técnica | **Todo propio, sin librerías**: CSS, SVG en línea y Web Audio; sin build |

**Supuestos aceptados:** el progreso vive solo en el navegador (sin cuentas ni datos personales; Ley 1581); los parches son **propios de la app**, no insignias oficiales de la ASC; sin rachas, puntos que se pierdan ni notificaciones; el contenido doctrinal **no cambia**; se conservan offline, sin build y AA en claro y oscuro.

**Fuera de alcance:** cuentas o sincronización entre dispositivos, cambios de contenido o doctrina, cambio del ícono, sonidos con archivos de audio, librerías externas.

## 2. Sistema visual

### 2.1 Color

Definido como variables en `assets/tokens.css`, con equivalentes para modo oscuro.

| Token | Valor | Uso |
|---|---|---|
| `--brand` | `#622599` | Marca principal |
| `--brand-deep` | `#3D1660` | Cabeceras, noche de campamento (claro) |
| `--accent` | `#FFE675` | Puntadas, logros, acento sobre morado |
| `--cyan` | `#00AFEF` | Solo decorativo (2,5:1 sobre blanco: nunca texto) |
| `--night` | `#1b1030` | Fondo del modo oscuro y de la Bienvenida |
| `--ink` / `--muted` / `--bg` | `#2C2927` / `#636363` / `#F2F5F7` | Texto, texto secundario, fondo claro |

**Ramas** (oficiales de scout.org.co, medidas el 15/10/2026), con el color de texto que pasa AA encima:

| Rama | Unidad | Color | Texto encima |
|---|---|---|---|
| Cachorros | Familia | `#f0592b` | `#3a1405` |
| Lobatos | Manada | `#ffd00f` | `#3d2e00` |
| Scouts | Tropa | `#016937` | `#ffffff` |
| Nómadas Scout | Comunidad | `#233f96` | `#ffffff` |
| Rovers | Clan | `#be2026` | `#ffffff` |

El color de rama **nunca** se usa como color de texto sobre blanco para Familia y Manada; como texto solo Tropa, Comunidad y Clan.

**Capas:** 0 `#622599` + brújula · 1 `#003087` + libro · 2 colores de rama + panal · 3 `#00a23b` (texto encima `#03260e`) + nudo.

### 2.2 Tipografía

Montserrat (se conserva; coherencia con el ecosistema). 800–900 en titulares de portada y de ficha; 400–600 en texto. Escala: 12 / 14 / 16 / 20 / 26 / 34 px.

### 2.3 Lenguaje gráfico

- **Puntada**: borde discontinuo «cosido» (`outline` o `border` dashed, amarillo sobre morado o color de capa sobre blanco) para parches, «En la práctica», separadores.
- **Hexágono**: forma de las ramas (panal de la Capa 2 y parches de rama).
- **Topográfico**: curvas de nivel SVG, sutiles, en cabeceras y Bienvenida.
- **Íconos SVG propios** de trazo (`currentColor`), en un **sprite en línea** en `index.html`: brújula, libro, panal, nudo, carpa, fogata, mapa, huella, lupa, diálogo, mochila, casa, altavoz, altavoz-silencio, tema, visto, flecha. Reemplazan los emojis actuales.
- **Prohibido**: redibujar, deformar o animar la flor de lis o el emblema mundial; insignias oficiales de progresión como parches; imágenes generadas por IA de personas, uniformes, insignias o escenas scout (ADR-031).

### 2.4 Superficies

Tarjetas de radio 16 px, sombra `0 4px 15px rgba(0,0,0,.08)`, cinta o borde izquierdo del color de capa o rama. Modo oscuro = noche de campamento (`--night`) con estrellas tenues.

## 3. Pantallas

Las rutas de hash actuales se conservan (`#/`, `#/capa/`, `#/concepto/`, `#/situacion/`, `#/ruta/`, `#/buscar/`, `#/situaciones`). Nuevas: `#/bienvenida`, `#/mochila`. Barra inferior: **Inicio · Buscar · Situaciones · Mochila**, con íconos del sprite y una pastilla que se desliza a la pestaña activa.

1. **Bienvenida** (`#/bienvenida`): se muestra sola la primera vez; luego, desde «Acerca de». Escena nocturna (fogata, estrellas, topográfico); título; tres frases (consulta, no certifica; todo con fuente oficial; tu avance queda en este teléfono); interruptor «¿Activar sonidos?»; botón «Empezar».
2. **Inicio**: cabecera `--brand-deep` con topográfico, saludo por hora y barra «Tu bitácora · N de 77 fichas»; «Sigue donde ibas» (última ruta y paso); cuatro tarjetas de capa con símbolo y anillo de avance; buscador; **Ficha del día**.
3. **Capa**: cabecera del color de la capa; lista de fichas con chip y visto si está leída. **Capa 2 = panal** de cinco hexágonos de rama que llevan a sus fichas.
4. **Ficha (concepto)**: cinta de color; término grande; definición; «En la práctica» con borde de puntada; **bloque de fuente oficial destacado** (documento y ubicación) como último bloque; relacionados como chips; «Siguiente en la ruta» si se llegó desde una ruta.
5. **Ruta**: sendero vertical de huellas; cada paso es un nodo que se rellena al leer; aviso «hay una ficha nueva» si la ruta creció después de ganar su parche.
6. **Situación**: tarjeta de diálogo con sus tres bloques actuales —«La situación», «Qué dice la doctrina» (con su fuente) y «Cómo aplicarlo»— y los conceptos en juego.
7. **Buscar**: resultados al instante, término resaltado, chip de capa o rama.
8. **Mochila** (`#/mochila`): parches ganados (color, puntada, fecha) y pendientes en silueta con «N de M fichas»; avance por capa y por rama; aviso si el almacenamiento no está disponible; «Reiniciar mi avance» con confirmación.

La cabecera lleva, además del tema claro u oscuro, el **interruptor de sonido** (altavoz).

## 4. Movimiento y sonido

### 4.1 Movimiento

Solo `transform` y `opacity`. Tres intensidades:

- **Ambiente** (solo Bienvenida y cabecera de Inicio): fogata con ciclo de ~1,5 s y brasas; ~12 estrellas desfasadas; deriva mínima del topográfico. Se pausa con `document.hidden`.
- **Navegación** (150–250 ms): entrada de pantalla (sube y aparece; al volver, entra desde el lado contrario); tarjetas en cascada (40 ms entre una y otra); hundimiento y rebote al tocar; pastilla de la barra inferior.
- **Logro**: ficha leída → el visto se dibuja y el anillo avanza. Parche ganado → hoja desde abajo, parche que entra girando, puntada que se «cose», ~30 chispas de la paleta; ~2 s; se cierra con un toque. Rama o capa completa → lo mismo con fanfarria y el panal iluminado.

**`prefers-reduced-motion: reduce`:** sin ambiente, rebotes ni chispas; solo fundidos de 100 ms; el parche se muestra estático con su texto. Nada parpadea más de 3 veces por segundo.

### 4.2 Sonido (Web Audio, sintetizado; sin archivos)

| Evento | Sonido | Duración |
|---|---|---|
| Toque de tarjeta o pestaña | «tic» de madera suave | 40 ms |
| Ficha leída | dos notas ascendentes (campanilla) | 250 ms |
| Parche ganado | arpegio de tres notas + brillo | 700 ms |
| Rama o capa completa | fanfarria de cinco notas | 1,2 s |
| Bienvenida (si el sonido está activo) | crepitar de fogata muy suave | mientras esté abierta |

Volumen bajo por defecto (ganancia maestra ≤ 0,25). Sin sonidos de error ni de reproche. El `AudioContext` se crea **solo** tras un gesto del usuario y **solo** si el sonido está activo. Vibración corta al ganar un parche, solo donde `navigator.vibrate` existe y si el sonido está activo.

## 5. Progreso y parches

### 5.1 Lectura

Una ficha cuenta como **leída** cuando su bloque de fuente oficial entra en pantalla (`IntersectionObserver`, umbral 0,6). Una situación, cuando entra «Cómo aplicarlo» (su último bloque). La primera vez dispara la animación y el sonido de ficha leída.

### 5.2 Parches (`data/parches.json`)

13 parches; las 77 fichas están en alguna ruta (comprobado el 16/10/2026), así que los parches de ruta cubren todo el contenido.

```json
[
  { "id": "conoce-la-manada", "titulo": "Conoce la Manada", "criterio": { "ruta": "conoce-la-manada" },
    "color": "#ffd00f", "texto": "#3d2e00", "simbolo": "panal", "forma": "hexagono" },
  { "id": "lector-de-situaciones", "titulo": "Lector de situaciones", "criterio": { "situaciones": "todas" },
    "color": "#00a23b", "texto": "#03260e", "simbolo": "dialogo", "forma": "circulo" },
  { "id": "bitacora-completa", "titulo": "Bitácora completa", "criterio": { "conceptos": "todos" },
    "color": "#3D1660", "texto": "#FFE675", "simbolo": "brujula", "forma": "circulo" }
]
```

- **11 de ruta** (uno por ruta; las 5 de rama con forma de hexágono y color de rama), **Lector de situaciones** (las 7) y **Bitácora completa** (las 77).
- Se gana al leer todas las fichas del criterio, en cualquier orden y dentro o fuera de la ruta.
- **Un parche ganado no se pierde**: queda con su fecha aunque el criterio crezca.
- Los títulos derivan del título de la ruta; no se inventa doctrina.

### 5.3 Ficha del día y «Sigue donde ibas»

- **Ficha del día:** índice = hash de la fecha local `YYYY-MM-DD` módulo el número de conceptos `auditado`. Es la misma para todos ese día; marca «nueva para ti» si no está leída.
- **Sigue donde ibas:** última ruta abierta y paso.

### 5.4 Almacenamiento (`localStorage`, clave `ps-progreso-v1`)

```json
{ "leidas": { "aprender-haciendo": "2026-10-16" },
  "situaciones": { "actividades-sin-rumbo": "2026-10-16" },
  "parches": { "conoce-la-manada": "2026-10-16" },
  "ultima": { "ruta": "por-que-educamos", "paso": 4 },
  "sonido": true, "bienvenida": true }
```

- Sin datos que identifiquen a la persona; nada sale del teléfono.
- Si `localStorage` falla (modo privado, bloqueo), `almacen.js` usa memoria y la Mochila avisa: «Tu avance no se guardará en este modo».
- «Reiniciar mi avance» borra solo esta clave (con confirmación).
- La preferencia de tema se conserva en su clave existente, `ps-theme`.
- El sufijo `-v1` permite migrar el formato sin perder lo ganado.

## 6. Arquitectura

PWA estática, sin build, con **módulos ES nativos** (`<script type="module">`).

| Archivo | Responsabilidad | Depende de |
|---|---|---|
| `assets/app.js` | Arranque, carga de datos, enrutador, cabecera y barra inferior | todos |
| `assets/vistas.js` | HTML de las ocho pantallas (funciones que reciben datos y estado, devuelven HTML) | `progreso.js` |
| `assets/progreso.js` | **Funciones puras**: marcar leída, avance por ruta, capa y rama, parches ganados y nuevos, ficha del día | — |
| `assets/almacen.js` | Leer y escribir `ps-progreso-v1` con respaldo en memoria | — |
| `assets/sonido.js` | Web Audio: los cinco sonidos, interruptor, activación por gesto | `almacen.js` |
| `assets/celebracion.js` | Hoja de parche, chispas, visto animado; respeta movimiento reducido | `sonido.js` |
| `assets/escena.js` | SVG animado de fogata, estrellas y topográfico; pausa con `document.hidden` | — |
| `assets/tokens.css` | Variables del sistema visual (claro y oscuro) | — |
| `assets/styles.css` | Componentes, pantallas, animaciones y `prefers-reduced-motion` | `tokens.css` |
| `index.html` | Estructura, sprite SVG en línea, carga de módulos | — |
| `data/parches.json` | Definición de los 13 parches | `rutas.json` |
| `sw.js` | Añade los archivos nuevos al app shell; sube `CACHE_VERSION` | — |

**Presupuesto de peso:** ≤ 120 KB en total sin la fuente (hoy ~19 KB).
**Compatibilidad:** navegadores con módulos ES (iOS Safari 11+, Chrome 61+). Sin respaldo para navegadores sin módulos.

## 7. Pruebas (Playwright + axe, `PRUEBAS-E2E/`)

- **Regresión:** las 42 pruebas actuales siguen en verde; se ajustan solo los selectores que cambian (barra inferior, búsqueda).
- **Datos:** `parches.json` válido; cada criterio de ruta apunta a una ruta existente; cada ruta tiene su parche; colores con texto que pasa AA.
- **Progreso (unitarias sobre `progreso.js`)** y **E2E:** llegar a la fuente marca la ficha; completar una ruta gana su parche y aparece en la Mochila; un parche ganado sobrevive aunque la ruta crezca; reiniciar borra; con `localStorage` bloqueado la app funciona y avisa.
- **Bienvenida:** aparece solo la primera vez; el interruptor de sonido persiste; no se crea `AudioContext` antes de un gesto ni con el sonido apagado.
- **Movimiento reducido:** con `prefers-reduced-motion` no quedan animaciones de ambiente ni chispas.
- **Accesibilidad:** axe AA en claro y oscuro en las ocho pantallas, incluidas Bienvenida y Mochila.
- **Responsive:** 375 px y escritorio.
- **Peso:** una prueba que suma el tamaño de `assets/` y `data/parches.json` contra el presupuesto.

## 8. Entrega

Por fases en la rama `rediseno-visual` (un push a `main` publica). Cada fase deja la app funcionando y la suite en verde:

1. Sistema visual, sprite de íconos y ficha.
2. Inicio, Capa (con panal), Ruta (sendero), Situación, Buscar, Mochila (sin progreso).
3. Progreso y parches.
4. Movimiento y sonido.
5. Bienvenida.

**Revisión del dueño:** capturas a 375 px y una grabación desde el servidor local antes de publicar.
**Publicar (decisión de Máximo):** suite en verde, `CACHE_VERSION`, merge a `main`, verificación en vivo, ADR en la raíz (se reserva al publicar), documentación del app (`README`, `ESQUEMA-CONTENIDO` con `parches.json`, `CLAUDE.md`) y bitácora.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Marca: el ícono actual es una flor de lis propia | Decisión del dueño mantenerlo; no se anima ni se usa como motivo |
| Colores de rama tomados del sitio en vivo pueden cambiar | Quedan como tokens; un cambio es una línea |
| Sonido en reuniones | Se pregunta al inicio, volumen bajo, nunca automático |
| Gamificación que genere ansiedad | Sin rachas, puntos, rankings ni notificaciones; los parches no se pierden |
| Avance perdido al borrar el navegador | Se avisa en la Bienvenida («tu avance queda en este teléfono») |
| Rendimiento en gama baja | Solo `transform` y `opacity`; ambiente pausado fuera de pantalla; presupuesto de peso con prueba |
