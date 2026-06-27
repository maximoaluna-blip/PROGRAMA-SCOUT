# Pruebas E2E — Programa Scout

Suite de Playwright + axe para la PWA. Adaptada del enfoque de `INDUCCION-ADULTOS/PRUEBAS-E2E`, pero específica para esta app (SPA con enrutado por hash, sin backend).

## Qué cubre

| Spec | Verifica |
|---|---|
| `data.spec.js` | Integridad del contenido: JSON válidos, sin IDs duplicados, sin enlaces rotos (`relacionados`/rutas/situaciones), y **todo concepto `auditado` tiene cita con fuente y página**. (Solo escritorio.) |
| `smoke.spec.js` | Home, capa, ficha de concepto y ruta cargan y renderizan sin errores JS. |
| `a11y.spec.js` | axe WCAG 2.0/2.1 A+AA en home/capa/concepto/búsqueda, tema claro y oscuro. (Solo escritorio.) |
| `responsive.spec.js` | Sin scroll horizontal y barra inferior visible, en escritorio y móvil (Pixel 5). |
| `search.spec.js` | **Regresión del foco** (escribir varias letras no pierde el cursor), resultados en vivo y estado vacío. |
| `pwa.spec.js` | Manifest válido y enlazado, ícono accesible, service worker registrado. |

## Correr localmente

```bash
cd PRUEBAS-E2E
npm install
npx playwright install chromium

# contra una copia local (recomendado): servir la raíz del repo y apuntar la suite
python -m http.server 8123 --directory ..    # en otra terminal
PS_BASE_URL=http://localhost:8123/ npx playwright test

# o contra el sitio público (default):
npx playwright test
```

Scripts: `npm run smoke | data | a11y | responsive | search | pwa`, y `npm run report` para ver el HTML.

## CI

`.github/workflows/pruebas-e2e.yml` corre la suite en cada push/PR a `main` (y a mano desde Actions): instala dependencias, sirve la raíz del repo en `localhost:8123` y ejecuta Playwright contra esa copia. Sube el reporte como artefacto si algo falla.

## Proyectos

- `desktop-chromium` — todo.
- `movil-android` (Pixel 5) — todo salvo lo etiquetado `@solo-escritorio` (a11y y data, que no dependen del viewport).
