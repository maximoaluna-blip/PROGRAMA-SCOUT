# Auditoría doctrinal — Capa 3 «Aplicación» (herramientas del dirigente y situaciones reales)

> **Fecha:** 14-sep-2026 · **Auditor:** `auditor-doctrinal-asc` (informe íntegro, sin edición) · **Veredicto: APTO CON CORRECCIONES MENORES** · 1 crítico · 3 mayores · 5 menores · 0 no verificables.
> **Estado:** las correcciones C1, M1, M3, AZUL-1…5 las aplica `corrector-doctrinal-asc` en `data/` (en curso). **M2 (entradas de glosario) condiciona la promoción a `auditado`**: se cierra en `GLOSARIO-ASC.md` §E antes de cambiar ningún `estado`. Nada se publica ni se sube `CACHE_VERSION` sin la compuerta humana.
> Redacción original de la Capa 3: agente redactor, mismo día, con verificación literal de 33 citas contra los PDF y suite `data` 8/8.

**Insumos revisados:** `data/conceptos.json` — los 12 conceptos `borrador`/`capa: 3` (los 65 `auditado` no se tocaron) · `data/situaciones.json` — las 7 situaciones (ids reales: `no-se-si-cuenta-como-aplico`, `la-familia-solo-viene-a-aplaudir`, `los-adultos-deciden-todo`, `una-carpeta-de-formatos-que-nadie-lee`, `la-salida-sin-analisis-de-riesgo`, `la-ceremonia-se-volvio-un-show`, `actividades-sin-rumbo`) · `data/rutas.json` — ruta `herramientas-del-dirigente` · `ESQUEMA-CONTENIDO.md`, `CLAUDE.md`, `GLOSARIO-ASC.md` §C/§E/§E-bis/§H, `INDUCCION-PROGRAMA-JOVENES/CREAR-CURSO.md` §14, `DOCUMENTOS BASE/_manifiesto-oficiales.json`.

**Fuentes oficiales consultadas (pypdf/openpyxl):** Modelo de Aplicación «El Gran Juego para la Vida» (DNPJ-2026-024) · Recurso «Herramientas de Seguimiento para la Progresión Personal 2.0» (42 págs.; **está en `2026/`, no en `HERRAMIENTAS POR RAMA/`**) · Guías 2026 de Familia, Manada, Tropa (Buenas Prácticas), Comunidad y Clan · Modelo de Aplicación de Bolsillo (DNPJ-2026-063) · PNPJ 2024 · `Planeación de Reunión y Oportunidades de Aprendizaje.xlsx` (DNPJ-2026-020) y `Registro Acompañamiento Progresión Personal.xlsx` (DNPJ-2026-021) · **Política Nacional a Salvo del Peligro** («Haré todo cuanto de mí dependa: Política Nacional de Entornos Seguros», dic-2025, Acuerdo C.S.N. 657 del 3-dic-2025, Acta 297) + Manual Operativo V1 (feb-2023) + QR del botón — **sí está en local**; el redactor la dio por ausente.

**Verificación de citas:** las 12 `cita.texto` se buscaron carácter a carácter (normalizando solo saltos de línea). **Las 12 aparecen en la página declarada.** Dos con diferencias tipográficas atribuibles a la extracción (AZUL-3, AZUL-5).

---

## Veredicto

**APTO CON CORRECCIONES MENORES** para 7 tarjetas + 5 situaciones + la ruta; **REQUIERE CORRECCIÓN** para 1 situación (`actividades-sin-rumbo`) y ajustes puntuales en 5 tarjetas y 1 situación. Un hallazgo transversal de glosario (M2) condiciona la promoción del lote.

---

## Hallazgos

### 🔴 Críticos

- **C1 · situación `actividades-sin-rumbo` (`doctrina` y `aplicacion`)** — Dice *"…son medios para alcanzar **objetivos de las Áreas de Crecimiento**"* y *"…vinculadas a **objetivos concretos de crecimiento**"*. Fuente: Modelo Cap. 6, p. 27 — *"El Modelo de Competencias Educativas representa una evolución conceptual y metodológica frente al sistema de objetivos educativos anteriormente usado"*; Cap. 8, p. 51; Glosario p. 104 (áreas → prioridades → competencias). GLOSARIO §E-bis: la cadena vigente es área → prioridades → competencias terminales → intermedias. «Objetivos educativos / objetivos de las áreas» es el vocabulario del sistema sustituido (PSNPJ 2020); en un campo llamado `doctrina` induce a la nomenclatura obsoleta. **Corrección:** `doctrina`: *"…las actividades no son fines en sí mismas: son oportunidades para que cada joven explore, aplique y profundice competencias educativas de las seis áreas de crecimiento."* `aplicacion`: *"…eligiendo actividades con participación de la unidad y vinculadas a competencias educativas concretas."* Ubicación de fuente: *"Cap. 3 §3.2, p. 15 (el Método como sistema) y Cap. 11, p. 75"*.

### 🟡 Mayores

- **M1 · «2+1» con dos significados en la misma ruta, sin desambiguar ni glosar** — `seguimiento-y-registro-de-la-progresion`: *"coevaluación 2+1"* (Recurso 2.0, Cap. 4 §4.3, p. 5: *"dos fortalezas y una mejora"*); `a-salvo-del-peligro-y-gestion-del-riesgo` y la situación `la-salida-sin-analisis-de-riesgo`: la **medida de protección 2+1** (Política ASP dic-2025, p. 26: *"al menos tres personas presentes… dos personas adultas responsables y una persona menor de edad, o una persona adulta y dos menores"*; mismo texto en Guía de Familia p. 77 y Guía de Manada p. 64). Ambos usos son correctos por separado, pero la situación lo usa a secas: *"Aplica 2+1 en todo acompañamiento"*. Es el patrón exacto del ADR-034 — un término, dos planos, cero entradas en el glosario. **Corrección:** en la situación, *"Aplica la **medida de protección 2+1** (nunca un adulto a solas con un menor) en todo acompañamiento."*; en la tarjeta de seguimiento, *"coevaluación 2+1 (dos fortalezas y una mejora)"*; entrada «2+1» en GLOSARIO §E con las dos acepciones.

- **M2 · Términos conceptuales de la Capa 3 ausentes del glosario (control que aprueba por ausencia de referencia)** — GLOSARIO §H remite los términos propios de PJ al *"§8 del CREAR-CURSO.md"*; en `INDUCCION-PROGRAMA-JOVENES/CREAR-CURSO.md` el §8 es «Riesgos y antídotos» y el glosario real es el **§14 «Glosario rápido para Cowork»** (solo: Protagonista de programa, Rama, Grupo natural, Marco simbólico, Áreas de crecimiento, 3 roles, DURASLID). Sin entrada en ninguno: **ABP, ciclo de Kolb, Exploro/Aplico/Profundizo, conducta observable, Hoja de Ruta / Ficha de Oportunidad de Aprendizaje (DNPJ-2026-020), Registro de Acompañamiento (DNPJ-2026-021), micro/meso/macrociclo, 2+1, Viejos Lobos, PARCE**, y los órganos por rama: **Encuentro del Cubil, Consejo de Roca, Consejo de Patrulla, Corte de Honor (de Tropa), Congreso de Comunidad, Consejos de Equipo, Consejo de Clan, Comité de Clan**. Tampoco la **Política ASP dic-2025** figura en GLOSARIO §C. Dos trampas a registrar: (i) el Modelo p. 83 escribe *"competencias **específicas**"* en el plano del joven — la tarjeta lo tradujo bien a «competencias educativas», pero §E-bis reserva «específica» al cargo del adulto; (ii) `CLAUDE.md` raíz prohíbe «Corte de Honor **de Grupo**» (órgano de control); la **Corte de Honor de la Tropa** es un órgano vigente distinto (Guía de Tropa p. 9; Recurso 2.0 p. 9). **Corrección:** crear las entradas (GLOSARIO §E o CREAR-CURSO §14, y arreglar la remisión «§8» → «§14» en GLOSARIO §H) **antes** de marcar `auditado` (CHECKLIST §C v3.1).

- **M3 · Generalización «las Guías de Dirigente 2026» donde solo algunas lo dicen** — (a) `planear-la-reunion-de-unidad` · `enLaPractica`: los cinco «documentos indispensables» son literales en Familia §12.2 p. 81 y Manada §12.3.2 p. 67; Clan §12.2 pp. 62-63 tiene lista propia sin registro de permanencia; Comunidad y Tropa no la tienen. (b) `ciclo-de-programa-con-abp` · `enLaPractica`: los «cuatro momentos» con esos nombres están en Familia §11.4 pp. 75-76 y Comunidad pp. 44-45; Manada §11.1 p. 62 con otros nombres; Clan y Tropa no lo detallan. **Corrección:** (a) *"Las Guías de Familia y de Manada (y, con sus propios nombres, la de Clan) cuentan las planeaciones de reuniones entre los documentos indispensables…"*; (b) *"Las Guías de Familia, Manada y Comunidad organizan el mismo ciclo en cuatro momentos…"*.

### 🔵 Menores

- **AZUL-1 · `familia-en-la-practica`** — *"En Cachorros **y Lobatos**, una nota breve a familias…"*: el Recurso 2.0 §5.1 p. 10 la propone en el kit de **Cachorros**; el de Lobatos (§5.2) no la incluye. → *"En Cachorros (y puede servir en Lobatos), una nota breve a familias…"*.
- **AZUL-2 · `consejos-y-asambleas-de-unidad` · `definicion`** — *"todos los **Nómadas** con voz y voto"* → *"**Nómadas Scout**"* (Guía de Comunidad p. 16). Y distinguir grupo natural vs. unidad: *"Unos son del pequeño grupo (Consejo de Patrulla, Consejo de Equipo) y otros de toda la unidad (Corte de Honor, Congreso de Comunidad, Consejo de Clan)."*
- **AZUL-3 · `a-salvo-del-peligro-y-gestion-del-riesgo` · `cita.texto`** — la extracción del Modelo p. 103 da *"seguros — físicos, emocionales y digitales —en toda"* y la tarjeta *"seguros —físicos, emocionales y digitales— en toda"*: solo cambia la posición de los espacios junto a las rayas (salto de línea en el PDF). Cotejo visual y dejar la forma del original.
- **AZUL-4 · misma tarjeta · `definicion`** — *"la Política Nacional «Haré Todo Cuanto de Mí Dependa»"*: título completo **«Haré todo cuanto de mí dependa: Política Nacional de Entornos Seguros»** (Política ASP, portada y p. 49; Guía de Familia p. 76). Añadir que la aprobó el Acuerdo C.S.N. 657 del 3-dic-2025; los cinco pasos de gestión del riesgo vienen de la Guía de Manada §11.2.2, p. 65 (correctos): nombrar esa fuente.
- **AZUL-5 · `planear-la-reunion-de-unidad` · `cita.texto`** — el PDF muestra *"metod ológica"* (corte de línea); la tarjeta escribe *"metodológica"*. Correcto; se anota para que no se «corrija» hacia atrás.

---

## Afirmaciones NO VERIFICABLES

Ninguna. Todas las afirmaciones de datos (códigos DNPJ-2026-020/021, campos de la Hoja de Ruta y la Ficha, siete tipos de reconocimiento, ritmos 4-12 / 8-16 / anual, «2-8 minutos», «al menos dos adultos y uno por cada cinco Cachorros», correo y botón ASP) tienen respaldo en documento local.

**Nota de integridad de fuente:** el PDF local del Recurso 2.0 tiene la página 1 vacía y la 2 arranca a mitad del Cap. 3 (faltan Caps. 1-3 casi completos), y conserva una nota editorial en la p. 12 (*"insertar en doc. final, porque aquí no pude y que se viera bonito"*). Sin marcador de versión propio (pie genérico CNC-028-1). Las páginas citadas como «paginación PDF» son exactas **para este archivo**; si se reemplaza por la versión final de `scout.org.co/biblioteca/dnpj`, re-verificar las 5 ubicaciones que dependen de él (`planear…` p. 35, `seguimiento…` p. 9, `retroalimentacion…` p. 16, `experiencias…` p. 23, situación `carpeta…` pp. 12 y 28).

---

## Respuesta a las 5 dudas del redactor

**(a) Cinco momentos con ABP vs. cuatro momentos.** Conviven legítimamente; la formulación canónica es la del Modelo. Cap. 11 §11.2, pp. 75-77: cinco momentos con ABP (diagnóstico participativo, planificación con ABP, ejecución iterativa, presentación pública, evaluación y transferencia). El Glosario del Modelo (p. 104) lo resume como *"diagnóstico, planificación, ejecución, celebración y evaluación"*, y la Versión de Bolsillo (DNPJ-2026-063, p. 9) como *"Planear, hacer, celebrar, revisar y volver a proyectar"*. Las Guías de Familia (pp. 75-76), Comunidad (pp. 44-45) y Manada (p. 62) usan el esquema operativo de cuatro momentos; Clan y Tropa no lo detallan. No hay contradicción: el «momento 3 realización» abarca ejecución y presentación, y el «momento 4» equivale a evaluación y transferencia; lo que ABP añade es la presentación pública a un destinatario real. Solo corregir M3(b).

**(b) «En Rovers no se aplica el ciclo de programa» (Recurso 2.0, p. 12).** Texto en revisión, no doctrina: nota de borrador del propio documento que quedó impresa. La doctrina vigente dice lo contrario: Guía de Clan Cap. 11 §11.1, p. 56, define el Ciclo de Programa como *"la herramienta para que el Programa de Jóvenes llegue de manera eficaz"* en la rama, y p. 5 pide al dirigente de Clan *"Planifica con el ciclo de programa: diagnóstico, planeación, ejecución, evaluación"*; el Modelo Cap. 11 se dirige a *"cada unidad"* y describe el rol del dirigente en *"juventudes mayores"* (pp. 77-78) y los macrociclos (p. 78); el mismo Recurso incluye a Rovers en *"proyectos (Nómadas Scout y Rovers): una evidencia por fase"* (p. 14). La nota refleja la situación histórica que la Guía de Clan narra en pp. 56-57 (la guía ASC de 2009 *"dejó de incluir el concepto de ciclo de programa"* para Rovers, hoy reemplazado por el PARCE). Regla: no citar la p. 12; ninguna tarjeta lo hace.

**(c) «Consejo de Unidad» vs. Consejo de Patrulla / Corte de Honor.** El Modelo usa «Consejo de Unidad» (p. 73) y «consejos o asambleas de unidad» (p. 95) como **nombre genérico**, no como órgano; los nombres propios los fijan las Guías: Encuentro del Cubil (Familia §5.4, p. 32), Consejo de Roca (Manada §9.3, p. 54), Consejo de Patrulla y Corte de Honor (Tropa p. 9; Recurso 2.0 p. 9), Congreso de Comunidad y Consejos de Equipo (Comunidad p. 16), Consejo de Clan y Comité de Clan (Clan §5.5, p. 26; p. 52). La tarjeta debe hacer lo que ya hace: genérico del Modelo en título y cita, nombres propios por rama en el cuerpo; no inventar un órgano llamado «Consejo de Unidad». Añadir la distinción grupo natural / unidad (AZUL-2).

**(d) «Documentos indispensables» (Familia p. 81): ¿generalizable?** Parcialmente (ver M3a). Lo transversal a las cinco ramas es la herramienta DNPJ-2026-020 (pestañas Familia/Manada/Tropa/Comunidad/Clan; Recurso 2.0 Anexo 3, pp. 35-42).

**(e) Correo y botón ASP: ¿bastan las Guías como fuente?** Sí para una tarjeta de aplicación —son documentos oficiales DNPJ 2026—, y además **la Política ASP existe en local**: `DOCUMENTOS BASE/SCOUTS/DESARROLLO INSTITUCIONAL/A SALVO DEL PELIGRO/Politica Nacional a Salvo del Peligro.pdf` (DNDI, aprobada por Acuerdo C.S.N. 657 del 3-dic-2025, p. 49). Confirma la medida 2+1 con el mismo texto (p. 26) y el botón *"Me Pongo A Salvo del Peligro"* con códigos QR (p. 44). El correo `asalvodelpeligro@scout.org.co` solo aparece en las Guías (Familia p. 77, Manada p. 65) — válido, citando esa fuente. El Manual Operativo 2023 (§7.7, p. 18) lo llama «Botón de Denuncias ASP»; usar el nombre 2025/2026. Colaterales: agregar la Política ASP 2025 a GLOSARIO §C y a `TRAZABILIDAD.csv` (la fila PJ-04/24 aún dice *"(pendiente descarga ASP)"*).

---

## Verificado y correcto (resumen)

- **Citas exactas y en página** (10/12 sin diferencia; 2 con artefactos tipográficos): Modelo pp. 60, 66, 67, 73, 75, 83, 95, 103; Recurso 2.0 pp. 9, 16, 23, 35.
- `ciclo-de-programa-con-abp`: cinco momentos (pp. 76-77), ritmos micro/meso/macro (p. 78), *"No hay obligación de sincronizar progresión personal con el calendario del ciclo"* (p. 79), *"si falta alguno, no hay ABP"* (p. 80).
- `ciclo-operativo-seis-pasos`: los seis pasos, «Kolb en 4 preguntas; dos minutos bastan», *"este ciclo no te encadena; te da ritmo"* (pp. 66-67). «2 o 3 conductas observables por competencia **educativa**»: la tarjeta añade el adjetivo que el Modelo omite; plano correcto.
- `disenar-una-oportunidad-de-aprendizaje`: tablero DURASLID con las 8 preguntas literales (p. 73); nombre y código de la herramienta (DNPJ-2026-020); bloques de la Ficha (Recurso 2.0 pp. 35-39; xlsx).
- `planear-la-reunion-de-unidad`: campos de la Hoja de Ruta (xlsx) — exactos.
- `a-salvo-del-peligro…`: definición (Modelo p. 103), botón/QR (Guías Familia p. 77, Manada p. 64; Política p. 44), 2+1 (Política p. 26), gestión del riesgo en cinco pasos (Manada p. 65), bloque de riesgo de la Ficha (Recurso p. 38), *"al menos dos adultos… un adulto por cada cinco Cachorros"* (Familia §11.7, p. 78).
- `consejos-y-asambleas-de-unidad`: Encuentro del Cubil, «Piedra de la Palabra»/«Tronco del Consejo» (Familia p. 32); Consejo de Roca *"corazón de la participación"* (Manada p. 54); democracia representativa (Tropa p. 9); Congreso con voz y voto (Comunidad p. 16); Consejo de Clan elige anualmente al Comité (Clan p. 26); acta simple (Recurso p. 9).
- `observar-y-facilitar-la-reflexion`: 3-4 indicadores, anecdotario, regla de oro (p. 61); Kolb en 2-8 minutos (p. 62); evitar «por qué», validar sin psicologizar, devolver con hechos, compromiso fechado (p. 63); clima e inclusión (p. 65).
- `seguimiento-y-registro-de-la-progresion`: banco de técnicas (Cap. 4), lógica del kit (p. 10), registrar lo educativo y no lo íntimo (pp. 16, 20), «Voz del Protagonista de Programa» y sus tres preguntas (Recurso p. 34; xlsx DNPJ-2026-021), *"orientar el crecimiento, no clasificar personas"* (p. 28).
- `retroalimentacion-vi-logro-proximo-paso`: estructura, énfasis por momento, tono, fórmula de corrección, dos preguntas de cierre (pp. 16-19).
- `experiencias-externas-como-oportunidades`: tres conductas de cuidado y tres puertas (pp. 23-25), Kolb (p. 26), evidencia proporcional y *"el dirigente no es investigador"* (pp. 23, 26-27).
- `reconocimiento-en-la-practica`: siete tipos (pp. 83-84), *"no anuncias números ni colecciones de insignias"* y *"el símbolo… no ocupa el lugar del aprendizaje: lo ilumina"* (p. 81), chequeo de seguridad (p. 82). La traducción de «competencias específicas» (p. 83) a «competencias educativas» es correcta en el plano del joven.
- `familia-en-la-practica`: seis acciones (pp. 87-88), rol del dirigente en el vínculo (p. 88), padres observando en Familia (Familia §11.8, p. 78), gestos en ceremonias (p. 84).
- Situaciones: todas con página exacta (Modelo pp. 40, 48, 61, 65, 67-68, 79, 81-84, 87-88, 97; Recurso pp. 12, 20, 28; Comunidad pp. 16, 44; Manada p. 65).
- Terminología: 0 apariciones de «asesor personal», «grado», «Caminantes», «PSNPJ», «competencia» a secas en plano cruzado. Integridad técnica: todos los `relacionados`, `conceptos` y `pasos` apuntan a ids existentes.

---

## Ids promovibles a `auditado` sin cambios en su texto

Condición transversal: cerrar **M2** antes de marcar `auditado` (CHECKLIST §C).

**Conceptos (7):** `ciclo-operativo-seis-pasos`, `disenar-una-oportunidad-de-aprendizaje`, `observar-y-facilitar-la-reflexion`, `seguimiento-y-registro-de-la-progresion`, `retroalimentacion-vi-logro-proximo-paso`, `experiencias-externas-como-oportunidades`, `reconocimiento-en-la-practica`.
**Situaciones (5):** `no-se-si-cuenta-como-aplico`, `la-familia-solo-viene-a-aplaudir`, `los-adultos-deciden-todo`, `una-carpeta-de-formatos-que-nadie-lee`, `la-ceremonia-se-volvio-un-show`.
**Ruta:** `herramientas-del-dirigente` (cuando sus 12 pasos queden `auditado`).
**Corregir y re-promover:** `ciclo-de-programa-con-abp` (M3b), `planear-la-reunion-de-unidad` (M3a), `a-salvo-del-peligro-y-gestion-del-riesgo` (AZUL-3, AZUL-4), `consejos-y-asambleas-de-unidad` (AZUL-2), `familia-en-la-practica` (AZUL-1), `la-salida-sin-analisis-de-riesgo` (M1), `actividades-sin-rumbo` (C1).
**Retirar:** ninguno.

## Nota sobre lenguaje

Las tarjetas logran precisión y sencillez a la vez: tuteo, ejemplos concretos, reformulación simple después de cada cita. Ninguna simplificación introduce error; el único error conceptual (C1) es una palabra obsoleta, no una simplificación.
