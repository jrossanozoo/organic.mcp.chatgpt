# Prompt de ejecucion para la primera etapa de conocimiento MCP

## Rol y objetivo

Actua sobre este repositorio para ejecutar la primera etapa de evolucion del servidor MCP. El objetivo es incorporar conocimiento compartido y especializado de FoxPro, Organic y Dragon2028, exponerlo mediante recursos, prompts y herramientas, y dejar el servidor compilable y levantable.

## Alcance obligatorio

Debes cubrir solo esta primera etapa:

1. soportar shared y dragon2028 en el modelo de contexto,
2. incorporar conocimiento compartido de FoxPro,
3. incorporar conocimiento inicial de Organic,
4. incorporar conocimiento inicial de Dragon2028,
5. exponer recursos MCP para ese conocimiento,
6. exponer prompts contextuales y especializados,
7. implementar al menos una herramienta de validacion FoxPro y una de asistencia estructural,
8. verificar build y arranque del servidor.

## Restricciones obligatorias

1. No modificar archivos generados din_*.prg.
2. Mantener compatibilidad razonable con businessLine cuando el modelo se extienda.
3. No duplicar conocimiento shared dentro de cada linea.
4. Exponer como recurso solo conocimiento canonico, ejemplos o plantillas.
5. Exponer como prompt solo razonamiento guiado por contexto.
6. Exponer como herramienta solo lo que pueda validarse o decidirse de forma suficientemente deterministica.
7. Hacer cambios pequenos, coherentes y verificables.

## Restricciones especificas de FoxPro

No asumas caracteristicas modernas del lenguaje. Trabaja solo con evidencia de la guia base y del material del repositorio.

No debes asumir:

1. funciones lambda o anonimas modernas,
2. method chaining moderno como estilo esperable,
3. async o await,
4. interfaces o generics tipo TypeScript,
5. modulos tipo import o export,
6. sintaxis moderna que no aparezca en los ejemplos FoxPro del repo.

Debes respetar como base:

1. tabs obligatorios,
2. maximo 50 lineas por funcion, metodo o procedimiento,
3. maximo 3 niveles de identacion,
4. parametros con prefijo t mas tipo,
5. variables locales con local y prefijo l mas tipo,
6. retorno por variable local tipada,
7. migracion de if complejos a do case,
8. uso de NOTE cuando aporte contexto funcional,
9. Dodefault() en especializaciones y ciclo de vida.

## Reglas especificas de Organic

1. Nucleo contiene servicios base.
2. Dibujante contiene interfaz, formularios y reportes.
3. Generadores produce codigo desde metadata DBF y plantillas.
4. Felino contiene reglas de negocio base y entidades compartidas entre productos.
5. Las especializaciones por producto heredan desde la entidad base.
6. Los archivos din_*.prg no deben tocarse manualmente.

## Reglas especificas de Dragon2028

1. Organic.Core es la base.
2. Organic.Drawing depende de Organic.Core.
3. Organic.Generator depende de Organic.Core y Organic.Drawing.
4. Organic.Feline depende de Organic.Core y Organic.Drawing, pero no de Organic.Generator en forma directa.
5. Organic.Dragonfish y Organic.ZL heredan desde Organic.Feline.
6. No debe haber referencias cruzadas invalidas entre modulos.
7. Las definiciones heredadas en DBF deben migrar gradualmente a XML.
8. Las propiedades usadas en entidades mediante this. o . dentro de with this deben declararse explicitamente en la clase.
9. NOTE debe documentar supuestos, equivalencias y pendientes de migracion cuando corresponda.

## Orden de ejecucion

### Paso 1. Auditar el estado actual

1. Revisa tipos, handlers, utilidades y estructura de knowledge.
2. Determina que partes de la primera etapa ya existen y que huecos reales faltan.
3. Evita reimplementar trabajo ya presente.

### Paso 2. Resolver el modelo de contexto

1. Soporta shared y dragon2028.
2. Agrega o confirma line, layer, product y artifactType.
3. Mantiene compatibilidad con businessLine.
4. Ajusta el detector para FoxPro monolitico y Dragon2028 modular.

### Paso 3. Cargar la base de conocimiento

1. Crea o completa src/knowledge/shared.
2. Crea o completa contenido inicial de Organic.
3. Crea o completa contenido inicial de Dragon2028.
4. Mantiene shared como base transversal y evita duplicacion.

### Paso 4. Exponer recursos y prompts

1. Publica recursos para shared y dragon2028 ademas de los existentes.
2. Ajusta prompts base para combinar shared mas linea.
3. Agrega prompts especializados para refactorizacion FoxPro, NOTE, ubicacion de entidades, arquitectura Dragon2028 y migracion DBF a XML.

### Paso 5. Implementar herramientas prioritarias

1. Implementa validate-foxpro-standards o equivalente.
2. Implementa suggest-solution-layer o equivalente.
3. Si ya existe una version parcial, complétala o validala.

### Paso 6. Verificar y levantar el servidor

1. Ejecuta el build.
2. Corrige errores relevantes si aparecen.
3. Levanta el servidor en un modo util para prueba.
4. Verifica al menos salud y arranque correcto.

## Validaciones minimas esperadas

La validacion FoxPro debe cubrir, como minimo:

1. tabs en identacion,
2. nombres de parametros y locales,
3. presencia de local,
4. retorno tipado por variable local,
5. longitud maxima,
6. niveles de identacion,
7. deteccion de if con exceso de condiciones.

La asistencia estructural debe poder distinguir, como minimo:

1. cambio de negocio base en Felino,
2. cambio visual en Dibujante,
3. cambio de servicio base en Nucleo,
4. cambio de generacion o metadata en Generadores,
5. cambio de modulo o metadata XML en Dragon2028,
6. caso compartido reusable en shared.

## Resultado esperado

1. Cambios de codigo necesarios para la primera etapa.
2. Markdowns de conocimiento indexables en src/knowledge/shared, src/knowledge/organic y src/knowledge/dragon2028.
3. Recursos, prompts y herramientas funcionales para la etapa.
4. Build en verde o con errores residuales explicitados.
5. Servidor MCP levantado para prueba.

## Formato de cierre esperado

Al terminar:

1. resume que se implemento,
2. lista verificaciones ejecutadas,
3. informa en que endpoint o modo quedo levantado el servidor,
4. aclara pendientes reales, si existen.