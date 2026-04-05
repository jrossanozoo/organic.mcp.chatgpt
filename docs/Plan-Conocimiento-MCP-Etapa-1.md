# Plan de Implementacion de la Primera Etapa de Conocimiento MCP

## Resumen ejecutivo

Esta primera etapa busca convertir la guia base de conocimiento en una capacidad utilizable dentro del servidor MCP para asistir el desarrollo sobre tres ambitos claramente separados:

1. conocimiento compartido de FoxPro,
2. conocimiento especifico de Organic,
3. conocimiento especifico de Dragon2028.

El objetivo no es modelar todo el dominio futuro ni automatizar por completo la generacion de codigo. El objetivo es dejar una primera capa de conocimiento confiable, consultable y operativa, expuesta mediante recursos, prompts y herramientas donde cada mecanismo se use para el tipo de ayuda correcto.

El alcance de esta etapa incluye:

1. extender el modelo de contexto para soportar shared y dragon2028,
2. cargar conocimiento FoxPro transversal reutilizable,
3. cargar conocimiento inicial de Organic y Dragon2028,
4. exponer recursos y prompts especializados,
5. implementar al menos una validacion FoxPro deterministica y una herramienta de asistencia estructural.

Queda fuera de alcance en esta etapa:

1. cubrir exhaustivamente todas las lineas futuras,
2. migrar de forma completa DBF a XML,
3. automatizar generacion final avanzada de codigo,
4. incorporar Lince como foco principal de esta documentacion.

La restriccion mas importante del trabajo es metodologica: FoxPro debe documentarse y asistirse segun sus caracteristicas reales observables en la guia base y en los ejemplos del repositorio. No deben asumirse capacidades modernas inexistentes como funciones lambda, method chaining moderno, async o modelos de modulos tipo import/export.

## Plan conceptual de implementacion

### Objetivo conceptual

Construir una base de conocimiento MCP que distinga con claridad lo compartido de lo especifico, y que ayude a un agente o desarrollador a responder estas preguntas con el menor margen de ambiguedad posible:

1. que regla FoxPro aplica siempre,
2. donde debe vivir un cambio en Organic,
3. como respetar ownership y limites modulares en Dragon2028,
4. cuando una ayuda debe salir como recurso, como prompt o como herramienta.

### Principios de modelado del conocimiento

1. Lo canonico y estable debe vivir como recurso. Aqui entran estandares, arquitectura, patrones, ejemplos y plantillas.
2. El razonamiento guiado debe vivir como prompt. Aqui entran refactorizacion FoxPro, ubicacion de entidades, NOTE y migracion DBF a XML.
3. Lo verificable o transformable de forma objetiva debe vivir como herramienta. Aqui entran validaciones FoxPro y sugerencias estructurales con reglas deterministicas.
4. Lo shared debe componerse antes que lo especifico de linea. Un contexto Organic o Dragon2028 debe heredar primero la base FoxPro transversal.
5. No se debe duplicar conocimiento compartido dentro de cada linea. La linea solo agrega especializacion.

### Modelo de conocimiento objetivo

El modelo conceptual de contexto debe trabajar al menos con:

1. line, para distinguir shared, organic, lince y dragon2028,
2. layer, para diferenciar core, business, ui, generators, module, data, testing o shared,
3. product, para identificar producto o modulo inmediato,
4. artifactType, para distinguir codigo FoxPro, generado, DBF, XML, markdown, test o TypeScript.

Esto permite que un mismo agente no responda igual ante:

1. una regla de naming FoxPro,
2. una especializacion de entidad en Felino,
3. una migracion de definiciones DBF a XML,
4. una duda sobre un archivo generado din_*.prg.

### Caracterizacion operativa de FoxPro para esta etapa

La base conceptual debe asumir FoxPro y Visual FoxPro con las siguientes caracteristicas observables en el material del repo y en la guia base:

1. herencia simple basada en clases,
2. metodos definidos con Function y Procedure,
3. uso de Dodefault() para delegacion a la clase padre,
4. convenciones de nombres tipadas en parametros y variables locales,
5. control de acceso y asignacion mediante metodos Validar_ y Setear_,
6. uso de NOTE como comentario funcional multilinea,
7. preocupacion fuerte por longitud de funcion, anidacion e identacion,
8. separacion entre clases base, clases generadas y especializaciones manuales.

No deben asumirse como parte del modelo:

1. lambdas o funciones anonimas modernas,
2. encadenamiento de metodos como rasgo de estilo a promover,
3. asincronia tipo async/await,
4. contratos de tipos modernos o interfaces tipo TypeScript,
5. modularidad nativa estilo import/export.

### Dominios de conocimiento por eje

#### Shared FoxPro

Debe capturar reglas transversales como:

1. tabs obligatorios,
2. maximo de 50 lineas por funcion,
3. maximo de 3 niveles de identacion,
4. parametros con prefijo t mas tipo,
5. locales con prefijo l mas tipo,
6. retorno por variable local tipada,
7. migracion de if complejos hacia do case,
8. uso correcto de NOTE.

#### Organic

Debe capturar al menos:

1. responsabilidades de Nucleo, Dibujante, Generadores y Felino,
2. regla de no modificar din_*.prg,
3. herencia de entidades base y especializaciones por producto,
4. ubicacion de reglas de negocio compartidas versus especificas,
5. relacion entre metadata DBF, generacion y clases especializadas.

#### Dragon2028

Debe capturar al menos:

1. dependencias permitidas entre modulos,
2. prohibicion de referencias cruzadas invalidas,
3. migracion de DBF a XML como direccion de arquitectura,
4. declaracion explicita de propiedades de entidades,
5. uso de NOTE para documentar supuestos y pendientes de migracion.

### Entregables conceptuales

La etapa queda bien planteada cuando existen estos entregables:

1. modelo de contexto extendido,
2. conocimiento base shared indexable,
3. conocimiento inicial Organic indexable,
4. conocimiento inicial Dragon2028 indexable,
5. prompts especializados que compongan shared mas linea,
6. herramientas deterministicas para validacion FoxPro y sugerencia estructural.

## Guia de implementacion

### Fase 1. Consolidar la base de verdad

Objetivo:

1. tomar como fuente principal la guia base,
2. contrastarla con ejemplos FoxPro reales del repositorio,
3. fijar restricciones de lenguaje antes de modelar conocimiento.

Acciones:

1. revisar la guia especializada de base,
2. revisar ejemplos .prg y conocimiento ya existente,
3. separar lo transversal de lo especifico de linea,
4. listar anti-supuestos para evitar extrapolaciones modernas.

Salida esperada:

1. un marco de trabajo donde FoxPro esta descrito segun evidencia del repo.

### Fase 2. Resolver el modelo de contexto

Objetivo:

1. permitir que el servidor detecte shared y dragon2028 ademas de las lineas historicas,
2. enriquecer el contexto para prompts y herramientas.

Acciones:

1. extender tipos y enums del dominio,
2. enriquecer el detector de contexto con line, layer, product y artifactType,
3. mantener compatibilidad con businessLine,
4. reflejar el contexto compuesto en prompts y respuestas de herramientas.

Salida esperada:

1. el servidor entiende si esta frente a conocimiento shared, a un monolito FoxPro o a un escenario modular Dragon2028.

### Fase 3. Cargar el conocimiento base

Objetivo:

1. transformar la guia conceptual en conocimiento consultable por categoria.

Acciones:

1. crear contenido shared para standards, patterns y best-practices,
2. crear contenido Organic para architecture, patterns y standards,
3. crear contenido Dragon2028 para architecture, patterns, standards y mejores practicas,
4. mantener ejemplos claros y reutilizables.

Salida esperada:

1. el buscador puede indexar y recuperar conocimiento por linea y categoria.

### Fase 4. Exponer conocimiento mediante MCP

Objetivo:

1. publicar el conocimiento cargado a traves del protocolo MCP.

Acciones:

1. extender resources para shared y dragon2028,
2. combinar shared con la linea especifica en prompts,
3. agregar prompts especializados de FoxPro, Organic y Dragon2028,
4. mantener nombres de recursos y prompts estables.

Salida esperada:

1. el cliente MCP puede listar, leer y contextualizar conocimiento especializado.

### Fase 5. Implementar asistencia deterministica

Objetivo:

1. sacar de los prompts las validaciones y decisiones que pueden resolverse con reglas objetivas.

Acciones:

1. implementar validate-foxpro-standards,
2. implementar suggest-solution-layer,
3. reutilizar el contexto compuesto en ambas herramientas,
4. devolver reportes claros y accionables.

Salida esperada:

1. el sistema puede detectar incumplimientos FoxPro y sugerir ubicacion estructural sin depender solo de razonamiento abierto.

### Fase 6. Verificar y poner en operacion

Objetivo:

1. asegurar que la primera etapa es utilizable de punta a punta.

Acciones:

1. ejecutar build,
2. revisar errores del proyecto si aparecen,
3. levantar el servidor,
4. verificar salud del endpoint,
5. verificar que el conocimiento cargado puede exponerse.

Salida esperada:

1. primera etapa operativa y lista para evaluacion.

## Plan de desarrollo

### Bloque 1. Dominio y deteccion de contexto

Objetivo:

1. ampliar el modelo actual sin romper compatibilidad innecesaria.

Tareas:

1. soportar shared y dragon2028,
2. agregar line, layer, product y artifactType,
3. mejorar reglas de deteccion de FoxPro y de Dragon2028,
4. exponer el contexto ampliado en tools y prompts.

Criterios de aceptacion:

1. el detector devuelve linea y capa razonables,
2. las herramientas usan el nuevo contexto,
3. businessLine sigue funcionando como compatibilidad.

### Bloque 2. Base de conocimiento shared y de linea

Objetivo:

1. materializar el conocimiento canonico inicial.

Tareas:

1. crear estandares FoxPro shared,
2. crear patrones shared de refactorizacion y NOTE,
3. crear arquitectura, patrones y estandares de Organic,
4. crear arquitectura, patrones y estandares de Dragon2028.

Criterios de aceptacion:

1. existen markdowns indexables por categoria,
2. no hay duplicacion innecesaria de reglas shared,
3. cada linea solo agrega especializacion relevante.

### Bloque 3. Exposicion MCP

Objetivo:

1. hacer util el conocimiento a traves del protocolo.

Tareas:

1. extender resources,
2. extender prompts base y especificos,
3. combinar shared y linea en consultas,
4. revisar nombres y descripciones publicadas.

Criterios de aceptacion:

1. los recursos de shared y dragon2028 aparecen en el listado,
2. los prompts especializados existen y responden al contexto correcto,
3. los resultados indican appliedLines o equivalente cuando corresponde.

### Bloque 4. Herramientas y validacion

Objetivo:

1. cubrir el primer set de ayuda deterministica.

Tareas:

1. validar tabs, locales, retorno tipado, longitud, anidacion y complejidad condicional en FoxPro,
2. sugerir capa o ubicacion estructural segun linea, artefacto y descripcion,
3. reutilizar reglas de Organic y Dragon2028 para las recomendaciones.

Criterios de aceptacion:

1. la herramienta de validacion devuelve un reporte interpretable,
2. la herramienta estructural ubica correctamente cambios de generacion, negocio, UI o modulo,
3. ninguna de las herramientas promueve tocar din_*.prg.

### Bloque 5. Cierre operativo

Objetivo:

1. dejar la etapa ejecutada y verificable.

Tareas:

1. documentar el plan aprobado,
2. compilar el proyecto,
3. levantar el servidor en modo util para prueba,
4. verificar el endpoint de salud,
5. registrar cualquier pendiente real.

Criterios de aceptacion:

1. build en verde,
2. servidor arriba,
3. documentacion disponible en docs,
4. primera etapa evaluable por el equipo.

## Riesgos y decisiones de control

1. Riesgo: documentar FoxPro con un lente moderno y producir prompts equivocados.
   Control: usar la guia base y ejemplos reales del repo como fuente primaria.
2. Riesgo: duplicar conocimiento shared dentro de Organic o Dragon2028.
   Control: shared contiene la base FoxPro; la linea solo agrega especializacion.
3. Riesgo: mezclar reglas monoliticas con reglas modulares.
   Control: separar Organic y Dragon2028 por arquitectura, ownership y fuente de verdad.
4. Riesgo: validar por prompt lo que puede verificarse objetivamente.
   Control: mover validaciones FoxPro y sugerencias estructurales a herramientas.

## Definicion de terminado

La primera etapa queda terminada cuando:

1. el servidor soporta shared y dragon2028 junto con las lineas existentes,
2. existe conocimiento shared FoxPro consultable,
3. existe conocimiento inicial de Organic y Dragon2028 consultable,
4. existen prompts especializados alineados a esos contextos,
5. existe al menos una validacion FoxPro y una asistencia estructural funcionando,
6. el proyecto compila y el servidor puede levantarse para prueba.