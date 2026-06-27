# ESQUEMA-CONTENIDO.md — Modelo de datos de Programa Scout

> Fuente de verdad de la app. Todo el contenido vive en `/data/*.json` y es **auditable** con el agente `auditor-doctrinal-asc` antes de pasar de `borrador` a `auditado`.

## Principio: capas progresivas

El contenido va de lo **transversal** (capa 0) a lo **específico** (capa 3). Un concepto se define **una sola vez** y se enlaza desde donde haga falta con `relacionados`.

| Capa | id | Contenido |
|---|---|---|
| 0 | `transversal` | Propósito, método scout, ciclo de programa, áreas de crecimiento, mundo simbólico |
| 1 | `politica` | PSNPJ y su Modelo de Aplicación «El Gran Juego para la Vida» |
| 2 | `ramas` | Manada, Tropa, Caminantes, Rover |
| 3 | `aplicacion` | Herramientas del dirigente y situaciones reales |

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
