# ESQUEMA-CONTENIDO.md — Modelo de datos de Programa Scout

> Fuente de verdad de la app. Todo el contenido vive en `/data/*.json` y pasa por **dos compuertas** antes de quedar `auditado`:
> 1. **Doctrinal** — el agente `auditor-doctrinal-asc` coteja definiciones, citas y páginas contra los documentos oficiales.
> 2. **Técnica** — la prueba `PRUEBAS-E2E/tests/data.spec.js` exige JSON válidos, sin IDs duplicados, sin enlaces rotos (`relacionados`/rutas/situaciones) y que **todo concepto `auditado` tenga cita con fuente y ubicación**. Corre en CI en cada push.

## Principio: capas progresivas

El contenido va de lo **transversal** (capa 0) a lo **específico** (capa 3). Un concepto se define **una sola vez** y se enlaza desde donde haga falta con `relacionados`.

| Capa | id | Contenido |
|---|---|---|
| 0 | `transversal` | Enfoque educativo, Método Scout y sus 8 elementos, áreas de crecimiento, ciclo de programa |
| 1 | `politica` | PNPJ y su Modelo de Aplicación «El Gran Juego para la Vida» |
| 2 | `ramas` | Cachorros, Lobatos, Scouts, Nómadas Scout, Rovers |
| 3 | `aplicacion` | Herramientas del dirigente y situaciones reales |

### Estado del contenido (Capa 0)

- **Grupo A — enfoque educativo** (11 conceptos, `auditado`): propósito, educación no formal, 4 pilares (Delors/UNESCO), educación integral, autoeducación progresiva, educación basada en valores, fundamentos pedagógicos, áreas de crecimiento, prioridades educativas, competencias educativas. Fuentes: «Características Esenciales del Movimiento Scout» (WOSM 2019) y Modelo 2026.
- **Grupo B — Método Scout** (10 conceptos, `auditado`): el método + sus 8 elementos + equilibrio. Fuente: Modelo 2026, Cap. 3.
- **Grupo C — organización y dinámica** (6 conceptos, `auditado`): sección/rama/unidad, grupos naturales, oportunidades de aprendizaje, etapas de progresión, ciclo de programa, DURASLID. Fuente: Modelo 2026, Caps. 4, 5, 7, 8, 10, 11.
- **Grupo D — principios transversales** (6 conceptos, `auditado`): rol del dirigente, reconocimiento, participación juvenil, familia aliada, coeducación/diversidad/inclusión, Scouts por los ODS. Fuente: Modelo 2026, Caps. 9, 12–16.
- **Capa 1 — la Política y su Modelo** (8 conceptos, `auditado`): la PNPJ (DNPJ-2026-023) y «El Gran Juego para la Vida» — propósito, sujetos, principios, definición/características/elementos del PJ, criterios de calidad, operación por nivel. Fuente: PNPJ 2026.
- **Capa 2 — por rama COMPLETA** (24 conceptos, `auditado`): las 5 ramas — `cachorros` (Familia), `lobatos` (Manada), `scouts` (Tropa), `nomadas-scout` (Comunidad), `rovers` (Clan). Cada una instancia la plantilla de rama. Fuentes: las Guías de Dirigente por rama (2026) + Modelo 2026 Cap. 4.
- **65 conceptos auditados.** Pendiente: Capa 3 (herramientas y aplicación); situaciones reales.

### Plantilla de rama (Capa 2)

Cada rama instancia ~5 conceptos con `capa: 2` y `rama: <id>` (`cachorros`|`lobatos`|`scouts`|`nomadas-scout`|`rovers`): (1) la rama y su unidad (edad, momento de desarrollo), (2) el marco simbólico propio, (3) los grupos naturales propios, (4) la progresión propia, (5) el rol del dirigente en la rama. Enlazan a sus conceptos transversales de Capa 0 con `relacionados`.

> **Terminología:** la política vigente es **PNPJ** (Política Nacional de Programa de Jóvenes, 2024, DNPJ-2026-023). «PSNPJ 2020» es la versión sustituida — no usar para citar lo vigente.

## `data/conceptos.json` — tarjeta de concepto

```json
{
  "id": "metodo-scout",                 // kebab-case, único, estable (no cambiar)
  "termino": "Método Scout",
  "capa": 0,                             // nivel de capa (0–3)
  "rama": null,                          // null = transversal; o "cachorros"|"lobatos"|"scouts"|"nomadas-scout"|"rovers"
  "definicion": "…breve y clara…",
  "enLaPractica": "…cómo se ve en la realidad del dirigente…",
  "cita": {
    "texto": "cita textual del documento oficial (vacío si pendiente)",
    "fuente": "Política Nacional de Programa de Jóvenes (PNPJ, DNPJ-2026-023)",
    "ubicacion": "p. 12 / Art. 4.3"      // 'por verificar' mientras no se confirme
  },
  "relacionados": ["proposito-del-movimiento"],   // ids de otros conceptos
  "estado": "borrador"                   // borrador | auditado
}
```

## `data/situaciones.json` — caso real

```json
{
  "id": "actividades-sin-rumbo",
  "titulo": "frase corta del caso, en voz del dirigente",
  "caso": "descripción de la situación concreta",
  "doctrina": "qué dice la doctrina oficial",
  "aplicacion": "cómo aterrizarlo a la práctica",
  "conceptos": ["ciclo-de-programa"],    // conceptos en juego
  "fuente": { "fuente": "…", "ubicacion": "…" },
  "estado": "borrador"
}
```

## `data/rutas.json` — secuencia guiada

```json
{
  "id": "fundamentos-en-5-pasos",
  "titulo": "…",
  "descripcion": "…",
  "capa": 0,
  "pasos": ["proposito-del-movimiento", "metodo-scout"],  // ids de conceptos en orden
  "estado": "borrador"
}
```

## Reglas

1. **Nada se publica como `auditado`** sin pasar por `auditor-doctrinal-asc` contra los documentos en `DOCUMENTOS BASE/SCOUTS/PROGRAMA DE JOVENES/`.
2. **Citas con ubicación** (página o artículo). Mientras no se confirme, `ubicacion: "por verificar"` y la UI muestra el chip `borrador`.
3. **Un concepto, una vez.** Si dos ramas comparten un concepto transversal, vive en capa 0 y ambas lo enlazan.
4. **Términos vigentes** según `GLOSARIO-ASC.md` (evitar nomenclatura obsoleta).
5. **IDs estables**: una vez publicado un `id`, no se renombra (rompe enlaces y caché offline).
