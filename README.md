# Programa Scout — PWA de consulta del Programa de Jóvenes (ASC)

App **mobile-first** (Android e iPhone) para **consultar, aclarar y aterrizar** los conceptos del Programa de Jóvenes de la Asociación Scouts de Colombia. Complementa la plataforma de cursos `APP PARA APRENDIZAJE`: aquí no se certifica, se **consulta** —de forma guiada o a demanda.

**En vivo:** https://maximoaluna-blip.github.io/PROGRAMA-SCOUT/

## Qué es y qué no es

| Es | No es |
|---|---|
| Compañero de consulta de conceptos y situaciones | Un LMS / plataforma de cursos |
| Contenido **curado y auditado** (sin IA) | Un chatbot |
| PWA instalable, funciona **offline** | App nativa de tienda |

## Arquitectura

- **PWA estática** (HTML + CSS + JS vanilla, sin build) → se sirve igual que la plataforma hermana (GitHub Pages, repo propio `PROGRAMA-SCOUT`).
- **SPA con enrutado por hash** (`#/capa/...`, `#/concepto/...`, `#/ruta/...`, `#/buscar/...`).
- **Datos curados** en `/data/*.json` = fuente de verdad, auditable. Ver [`ESQUEMA-CONTENIDO.md`](ESQUEMA-CONTENIDO.md).
- **Offline** vía `sw.js` (service worker, estrategia stale-while-revalidate).
- **Capas progresivas**: transversal → política → ramas → aplicación.
- **Módulos ES** en `assets/` (sin build): `app.js` (arranque y enrutado), `vistas.js` (pantallas), `almacen.js` (localStorage con respaldo en memoria), `progreso.js` (lecturas y parches), `sonido.js` (sonidos sintetizados con Web Audio, sin archivos de audio), `escena.js` (escena de campamento), `celebracion.js` (celebración al ganar un parche); estilos en `tokens.css` y `styles.css`.
- **Progreso en el teléfono**: `localStorage` clave `ps-progreso-v1`, sin datos personales; 13 parches definidos en `data/parches.json`.

```
PROGRAMA SCOUT/
├─ index.html              · app-shell
├─ manifest.webmanifest    · instalable (Android/iOS)
├─ sw.js                   · offline (subir CACHE_VERSION al cambiar archivos)
├─ assets/  tokens.css · styles.css · app.js · vistas.js · almacen.js · progreso.js · sonido.js · escena.js · celebracion.js
├─ data/    capas · conceptos · situaciones · rutas · parches (.json)
├─ icons/   icon.svg
├─ PRUEBAS-E2E/            · suite Playwright + axe (ver su README)
├─ .github/workflows/      · CI (pruebas-e2e.yml)
├─ CLAUDE.md               · contexto operativo del repo
├─ ESQUEMA-CONTENIDO.md    · modelo de datos para autores
└─ README.md
```

## Cómo probarla en local

Necesita servirse por HTTP (el service worker y `fetch` no corren con `file://`):

```bash
# desde la carpeta PROGRAMA SCOUT
python -m http.server 8080
# luego abrir http://localhost:8080 en el navegador
```

Para instalarla en el celular: abrir la URL pública en Chrome (Android) o Safari (iPhone) → menú → «Agregar a pantalla de inicio». Tras la primera carga funciona sin conexión.

## Pruebas y CI

Suite **Playwright + axe** en [`PRUEBAS-E2E/`](PRUEBAS-E2E/README.md): integridad de datos (JSON, enlaces, citas de auditados), smoke, accesibilidad WCAG AA (claro/oscuro), responsive (escritorio + móvil), regresión de búsqueda y PWA (manifest + service worker). Corre en **GitHub Actions** en cada push/PR a `main`.

```bash
cd PRUEBAS-E2E && npm install && npx playwright install chromium && npx playwright test
```

## Despliegue

Repo propio `maximoaluna-blip/PROGRAMA-SCOUT`, GitHub Pages sirviendo desde la raíz (`main`, `/`), HTTPS forzado. **Publicar = `commit + push` a `main`** (redespliega ~1 min). Si cambian datos o assets, **subir `CACHE_VERSION` en `sw.js`** para invalidar la caché offline de los usuarios.

## Estado

- **Fase 0 — cimientos:** ✅ PWA instalable + offline, modelo de datos, búsqueda, navegación por capas, rutas y situaciones, tema claro/oscuro.
- **Fase 1 — Capa 0 COMPLETA (32 conceptos auditados):** Grupos A (enfoque educativo), B (Método Scout y sus 8 elementos), C (organización y dinámica) y D (principios transversales).
- **Fase 2 — Capa 1 COMPLETA (8 conceptos auditados):** la Política (PNPJ) y su Modelo «El Gran Juego para la Vida» — propósito, sujetos, principios, definición/características/elementos del PJ, criterios de calidad y operación por nivel.
- **Fase 3 — Capa 2 (por rama) COMPLETA:** las **5 ramas auditadas** (24 conceptos) — Cachorros (Familia), Lobatos (Manada), Scouts (Tropa), Nómadas Scout (Comunidad) y Rovers (Clan); cada una con su rama/unidad, marco simbólico, grupos naturales, progresión y dirigente.
- **77 conceptos auditados, 7 situaciones reales, 11 rutas guiadas** (lo publicado; Capas 0–3).
- **Fase 4 — Capa 3 «Aplicación» PUBLICADA (15-oct-2026; auditada el 14-sep-2026):** 12 conceptos `capa: 3` / `estado: auditado` (herramientas del dirigente: ciclo de programa con ABP, ciclo operativo de seis pasos, diseñar una oportunidad de aprendizaje, planear la reunión de unidad, ASP y gestión del riesgo, consejos y asambleas, observar y facilitar la reflexión, seguimiento y registro, retroalimentación, experiencias externas, reconocimiento, familia en la práctica), **7 situaciones reales** y la ruta `herramientas-del-dirigente` (12 pasos). Auditoría doctrinal en `AUDITORIA-CAPA-3.md` — **APTO CON CORRECCIONES MENORES** (1 crítico, 3 mayores, 5 menores; las 12 citas verificadas en su página); correcciones aplicadas por el corrector en `data/`; el hallazgo transversal M2 (términos ausentes del glosario) se cerró en `GLOSARIO-ASC.md` v1.5 §E. Suite `data` 8/8. Promovida a `auditado` por decisión del dueño el 15-oct-2026, con la suite E2E en verde y `CACHE_VERSION` v10.
- **Rutas:** las 11 en `auditado` desde el 15-oct-2026 (las 10 de las Capas 0–2 se quedaron en `borrador` al publicarse y mostraban el chip aunque todos sus conceptos estaban auditados).
- **Íconos:** `icons/icon.svg` es la fuente; de él salen los PNG (192, 512, maskable 512 y `apple-touch-icon` 180, estos dos a sangre), renderizados con el Chromium de Playwright (15-oct-2026). Si cambia el SVG, se regeneran los cuatro.

- **Rediseño visual (rama `rediseno-visual`, sin publicar):** Bienvenida con escena y elección de sonido, Inicio con bitácora, panal de ramas, sendero de rutas, Mochila con 13 parches y celebración al ganarlos. Peso de `assets/` + `data/parches.json`: **130,8 KB crudos** (133.910 B; ≈39 KB con gzip), por encima de los 120 KB del spec §6; `peso.spec.js` fija el tope en 140 KB como guardia y el dueño decide. `CACHE_VERSION` v20.

### Plantilla de rama (Capa 2)

Cada rama instancia ~5 conceptos (`capa: 2`, `rama: <id>`): la rama/unidad y su edad, el marco simbólico, los grupos naturales propios, la progresión propia y el rol del dirigente. Fuente: la Guía de Dirigente de la rama + el Modelo 2026 (Caps. 4–5).

## Identidad visual

Reutiliza los tokens de la plataforma ASC: morado `#622599`, amarillo `#ffe675`, cian `#00afef`, tipografía Montserrat. La cabecera usa `--header-bg` (morado fijo) para mantener contraste AA en ambos temas.
