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

```
PROGRAMA SCOUT/
├─ index.html              · app-shell
├─ manifest.webmanifest    · instalable (Android/iOS)
├─ sw.js                   · offline (subir CACHE_VERSION al cambiar archivos)
├─ assets/  styles.css · app.js
├─ data/    capas · conceptos · situaciones · rutas (.json)
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
- **40 conceptos auditados, 5 rutas guiadas.**
- **Pendiente:** situaciones reales; íconos PNG 192/512 para iOS; **Capa 2** (por rama: Cachorros, Lobatos, Scouts, Nómadas Scout, Rovers) y **Capa 3** (herramientas y aplicación).

## Identidad visual

Reutiliza los tokens de la plataforma ASC: morado `#622599`, amarillo `#ffe675`, cian `#00afef`, tipografía Montserrat. La cabecera usa `--header-bg` (morado fijo) para mantener contraste AA en ambos temas.
