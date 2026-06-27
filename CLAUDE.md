# CLAUDE.md — Programa Scout (PWA de consulta del PJ)

> Contexto operativo de **este repo**. Se carga al inicio de toda sesión que trabaje aquí.
> Forma parte del ecosistema `APP PARA APRENDIZAJE` (ver su `CLAUDE.md` y `ECOSISTEMA.md` raíz).
> **Dueño:** Máximo Aluna (`maximoaluna@gmail.com`, GitHub `maximoaluna-blip`). **Idioma:** español neutro colombiano.

## 1. Qué es

PWA **mobile-first** (Android/iPhone) para **consultar, aclarar y aterrizar** los conceptos del Programa de Jóvenes de la Asociación Scouts de Colombia. **Complementa** la plataforma de cursos (LMS); aquí NO se certifica, se **consulta** —guiado o a demanda. Contenido **curado y auditado, sin IA**. En vivo: https://maximoaluna-blip.github.io/PROGRAMA-SCOUT/

## 2. Arquitectura (resumen; detalle en README.md)

- PWA estática vanilla (HTML/CSS/JS, sin build), SPA con enrutado por hash. Offline con `sw.js`.
- **Fuente de verdad = `/data/*.json`** (`conceptos`, `capas`, `rutas`, `situaciones`). Modelo en `ESQUEMA-CONTENIDO.md`.
- **Capas progresivas**: 0 transversal → 1 política → 2 ramas → 3 aplicación.

## 3. Reglas no negociables

1. **Referente técnico = documentación oficial más reciente** del PJ (en `../DOCUMENTOS BASE/SCOUTS/PROGRAMA DE JOVENES/`, incl. carpeta `2026`). Citar con página/artículo.
2. **Doble compuerta antes de `auditado`:** (a) auditoría doctrinal con el agente `auditor-doctrinal-asc`; (b) la suite `PRUEBAS-E2E` en verde. Nada se marca `auditado` sin ambas.
3. **Un concepto, una vez** — vive en su capa y se enlaza con `relacionados`/`pasos`. **IDs estables** (no renombrar; rompe enlaces y caché).
4. **Al cambiar archivos, subir `CACHE_VERSION` en `sw.js`** (si no, los usuarios siguen con la versión cacheada).
5. **Terminología vigente** según `../GLOSARIO-ASC.md`. (Pendiente: el glosario y el Modelo 2026 difieren en la formulación de los 8 elementos del método; resolver con Máximo.)
6. **Accesibilidad AA**: la suite corre axe en claro y oscuro; no introducir regresiones de contraste.

## 4. Flujo para añadir/actualizar contenido

1. Extraer el texto **literal** del documento oficial (pypdf).
2. Redactar la tarjeta (definición + `enLaPractica` + `cita` con página) en `borrador`.
3. `auditor-doctrinal-asc` → aplicar correcciones respaldadas por fuente.
4. Verificar integridad/E2E (`cd PRUEBAS-E2E && npx playwright test`).
5. Promover a `auditado`.
6. Subir `CACHE_VERSION`, `commit + push` a `main`, verificar en producción.

## 5. Despliegue

GitHub Pages desde la raíz (`main`, `/`), HTTPS. Publicar = `commit + push` a `main` (~1 min). Verificar en vivo con `curl`/fetch antes de decir "publicado".

## 6. Estado

Capa 0: Grupos A (enfoque educativo) y B (Método Scout) **auditados** (20 conceptos). Pendiente: Grupos C y D, situaciones reales, íconos PNG iOS, capas 1–3. Ver `README.md` §Estado.
