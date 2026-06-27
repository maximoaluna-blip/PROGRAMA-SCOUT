# Programa Scout — PWA de consulta del Programa de Jóvenes (ASC)

App **mobile-first** (Android e iPhone) para **consultar, aclarar y aterrizar** los conceptos del Programa de Jóvenes de la Asociación Scouts de Colombia. Complementa la plataforma de cursos `APP PARA APRENDIZAJE`: aquí no se certifica, se **consulta** —de forma guiada o a demanda.

## Qué es y qué no es

| Es | No es |
|---|---|
| Compañero de consulta de conceptos y situaciones | Un LMS / plataforma de cursos |
| Contenido **curado y auditado** (sin IA) | Un chatbot |
| PWA instalable, funciona **offline** | App nativa de tienda |

## Arquitectura

- **PWA estática** (HTML + CSS + JS vanilla, sin build) → se sirve igual que la plataforma hermana (GitHub Pages).
- **Datos curados** en `/data/*.json` = fuente de verdad, auditable. Ver [`ESQUEMA-CONTENIDO.md`](ESQUEMA-CONTENIDO.md).
- **Offline** vía `sw.js` (service worker, estrategia stale-while-revalidate).
- **Capas progresivas**: transversal → política → ramas → aplicación.

```
PROGRAMA SCOUT/
├─ index.html              · app-shell
├─ manifest.webmanifest    · instalable (Android/iOS)
├─ sw.js                   · offline
├─ assets/  styles.css · app.js
├─ data/    capas · conceptos · situaciones · rutas (.json)
├─ icons/   icon.svg
├─ ESQUEMA-CONTENIDO.md    · modelo de datos para autores
└─ README.md
```

## Cómo probarla en local

Necesita servirse por HTTP (el service worker y `fetch` no corren con `file://`):

```bash
# desde la carpeta PROGRAMA SCOUT
python -m http.server 8080
# luego abrir http://localhost:8080 en el navegador (móvil: misma red, IP del PC)
```

Para instalarla en el celular: abrir la URL en Chrome (Android) o Safari (iPhone) → menú → «Agregar a pantalla de inicio».

## Estado

**Fase 0 — cimientos (hecha):** PWA instalable + offline, modelo de datos, búsqueda, navegación por capas, rutas y situaciones, tema claro/oscuro. Contenido de muestra en `borrador`.

**Pendiente (Fase 1):** redactar y **auditar** los conceptos de la Capa 0 contra la documentación oficial (`DOCUMENTOS BASE/SCOUTS/PROGRAMA DE JOVENES/`), reemplazando los borradores. Íconos PNG 192/512 para instalación óptima en iOS.

## Identidad visual

Reutiliza los tokens de la plataforma ASC: morado `#622599`, amarillo `#ffe675`, cian `#00afef`, tipografía Montserrat.
