# ESQUEMA-CONTENIDO.md — Modelo de datos de Programa Scout

> Fuente de verdad de la app. Todo el contenido vive en `/data/*.json` y pasa por **dos compuertas** antes de quedar `auditado`:
> 1. **Doctrinal** — el agente `auditor-doctrinal-asc` coteja definiciones, citas y páginas contra los documentos oficiales.
> 2. **Técnica** — la prueba `PRUEBAS-E2E/tests/data.spec.js` exige JSON válidos, sin IDs duplicados, sin enlaces rotos (`relacionados`/rutas/situaciones) y que **todo concepto `auditado` tenga cita con fuente y ubicación**. Corre en CI en cada push.

## Principio: capas progresivas

El contenido va de lo **transversal** (capa 0) a lo **específico** (capa 3). Un concepto se define **una sola vez** y se enlaza desde donde haga falta con `relacionados`.

| Capa | id | Contenido |
|---|---|---|
| 0 | `transversal` | Enfoque educativo, Método Scout y sus 8 elementos, áreas de crecimiento, ciclo de programa |
| 1 | `politica` | PSNPJ y su Modelo de Aplicación «El Gran Juego para la Vida» |
| 2 | `ramas` | Manada, Tropa, Caminantes, Rover |
| 3 | `aplicacion` | Herramientas del dirigente y situaciones reales |

### Estado del contenido (Capa 0)

- **Grupo A — enfoque educativo** (10 conceptos, `auditado`): propósito, educación no formal, 4 pilares (Delors/UNESCO), educación integral, autoeducación progresiva, educación basada en valores, fundamentos pedagógicos, áreas de crecimiento, prioridades educativas, competencias educativas. Fuentes: «Características Esenciales del Movimiento Scout» (WOSM 2019) y Modelo 2026.
- **Grupo B — Método Scout** (10 conceptos, `auditado`): el método + sus 8 elementos + equilibrio. Fuente: Modelo 2026, Cap. 3.
- **Pendiente:** Grupo C (organización y dinámica) y Grupo D (principios transversales); el stub `ciclo-de-programa` se desarrolla en el Grupo C.

## `data/conceptos.json` — tarjeta de concepto

```json
{
  "id": "metodo-scout",                 // kebab-case, único, estable (no cambiar)
  "termino": "Método Scout",
  "capa": 0,                             // nivel de capa (0–3)
  "rama": null,                          // null = transversal; o "manada"|"tropa"|"caminantes"|"rover"
  "definicion": "…breve y clara…",
  "enLaPractica": "…cómo se ve en la realidad del dirigente…",
  "cita": {
    "texto": "cita textual del documento oficial (vacío si pendiente)",
    "fuente": "Política Nacional de Programa de Jóvenes (PSNPJ 2020)",
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
