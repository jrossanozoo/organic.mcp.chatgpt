# Plan de Ejecucion de la Primera Etapa de Conocimiento MCP

## Objetivo operativo

Ejecutar la primera etapa de evolucion del servidor MCP para incorporar conocimiento transversal y especializado de Organic y Dragon2028, exponiendolo mediante recursos, prompts y herramientas sobre una arquitectura de contexto mas rica que la actual.

## Alcance de esta ejecucion

Esta ejecucion debe cubrir solo la primera etapa prioritaria:

1. Resolver el modelo de contexto para soportar `shared` y `dragon2028`.
2. Incorporar conocimiento compartido de codificacion FoxPro.
3. Incorporar conocimiento inicial de Organic y Dragon2028.
4. Exponer la primera version de recursos y prompts especializados.
5. Implementar al menos una herramienta de validacion FoxPro y una herramienta de asistencia estructural.

No forma parte de esta primera ejecucion:

1. Cubrir exhaustivamente todas las lineas de negocio futuras.
2. Automatizar la migracion completa DBF a XML.
3. Implementar generacion avanzada de codigo final.

## Restricciones y reglas obligatorias

1. No modificar archivos generados `din_*.prg`.
2. Mantener compatibilidad razonable con el modelo actual mientras se introduce el nuevo contexto.
3. Priorizar cambios pequenos y verificables.
4. No duplicar conocimiento transversal dentro de cada linea.
5. Exponer como herramienta solo lo que sea validable o transformable de forma deterministica.
6. Exponer como recurso el conocimiento canonico, ejemplos y plantillas.
7. Exponer como prompt el razonamiento guiado por contexto.

## Orden de ejecucion recomendado

### Paso 1. Ajustar el modelo del dominio MCP

Objetivo:

1. Incorporar soporte para `shared` y `dragon2028`.
2. Preparar el servidor para contexto compuesto.

Tareas:

1. Revisar tipos y configuracion actuales.
2. Extender el modelo de contexto con `line`, `layer`, `product` y `artifactType`.
3. Mantener compatibilidad con el campo actual `businessLine` cuando sea necesario.
4. Ajustar el detector para reconocer subproyectos monoliticos y modulos de Dragon2028.

Salida esperada:

1. El servidor puede detectar y representar correctamente `shared`, `organic`, `lince` y `dragon2028`.

### Paso 2. Preparar la estructura de conocimiento

Objetivo:

1. Crear una base organizada para conocimiento compartido y especializado.

Tareas:

1. Crear la carpeta `shared` dentro de `src/knowledge`.
2. Crear contenido inicial en `shared/standards`, `shared/patterns` y `shared/best-practices`.
3. Crear contenido inicial en `organic/architecture`, `organic/patterns` y `organic/standards`.
4. Crear contenido inicial en `dragon2028/architecture`, `dragon2028/patterns` y `dragon2028/standards`.

Salida esperada:

1. Existen recursos de conocimiento listos para indexar y consultar.

### Paso 3. Cargar conocimiento compartido FoxPro

Objetivo:

1. Convertir reglas base en conocimiento canonico reusable.

Tareas:

1. Documentar convenciones de nombres sin caracteres dependientes del idioma.
2. Documentar uso obligatorio de tabuladores.
3. Documentar reglas de identacion uniforme para clases, funciones y procedimientos.
4. Documentar limite de 3 condiciones antes de migrar a `do case`.
5. Documentar nomenclatura de parametros y locales.
6. Documentar limite de 50 lineas por unidad.
7. Documentar maximo de 3 niveles de identacion.
8. Documentar retorno tipado y variable local de retorno.
9. Documentar uso de `NOTE` como comentario multilinea funcional.

Salida esperada:

1. El conocimiento base puede alimentar prompts y validaciones.

### Paso 4. Cargar conocimiento Organic

Objetivo:

1. Dejar explicitas las responsabilidades y reglas del modelo monolitico.

Tareas:

1. Documentar responsabilidad de `Nucleo`, `Dibujante`, `Generadores` y `Felino`.
2. Documentar politica de entidades base y especializacion por producto.
3. Documentar regla de no modificacion de `din_*.prg`.
4. Incluir ejemplos canonicos de herencia.

Salida esperada:

1. El MCP puede orientar la ubicacion correcta de codigo y entidades en Organic.

### Paso 5. Cargar conocimiento Dragon2028

Objetivo:

1. Dejar explicita la arquitectura modular y la migracion a XML.

Tareas:

1. Documentar dependencias permitidas entre modulos.
2. Documentar ausencia de referencias cruzadas invalidas.
3. Documentar migracion de definiciones DBF a XML.
4. Documentar declaracion obligatoria de propiedades de entidades.
5. Incluir ejemplos de `NOTE` y estructuras XML iniciales.

Salida esperada:

1. El MCP puede asistir analisis y decisiones modulares en Dragon2028.

### Paso 6. Exponer recursos MCP

Objetivo:

1. Hacer accesible el conocimiento cargado desde el protocolo MCP.

Tareas:

1. Extender el listado de recursos para `shared` y `dragon2028`.
2. Publicar recursos de categorias indexables.
3. Publicar recursos adicionales de plantillas o guias si corresponde.
4. Verificar lectura correcta de recursos.

Salida esperada:

1. El cliente MCP puede navegar y leer conocimiento transversal y especializado.

### Paso 7. Exponer prompts especializados

Objetivo:

1. Guiar al modelo con contexto mas preciso y reusable.

Tareas:

1. Extender prompts base para las nuevas lineas y capas.
2. Agregar prompts especializados para:
	1. refactorizacion estructural FoxPro,
	2. documentacion `NOTE`,
	3. ubicacion de entidades,
	4. arquitectura Dragon2028,
	5. migracion DBF a XML.
3. Ajustar composicion de prompts para combinar conocimiento `shared` con el especializado.

Salida esperada:

1. El MCP puede responder con prompts alineados al contexto real.

### Paso 8. Implementar herramientas prioritarias

Objetivo:

1. Mover validaciones objetivas a herramientas deterministicas.

Tareas:

1. Implementar una herramienta `validate-foxpro-standards` o equivalente.
2. Implementar una herramienta `suggest-solution-layer` o equivalente.
3. Si el tiempo alcanza, implementar una herramienta `generate-foxpro-note-template`.

Validaciones minimas sugeridas para el validador:

1. Presencia de tabs en identacion.
2. Convencion de nombres de parametros y locales.
3. Existencia de declaracion `local`.
4. Retorno tipado.
5. Longitud maxima y niveles de identacion.
6. Deteccion de `if` con exceso de condiciones.

Salida esperada:

1. El MCP no depende solo de prompts para controlar estandares base.

### Paso 9. Verificacion final

Objetivo:

1. Asegurar consistencia tecnica y funcional.

Tareas:

1. Ejecutar build o validacion equivalente.
2. Verificar que los recursos se listan y leen correctamente.
3. Verificar que los prompts nuevos aparecen en el listado.
4. Probar las herramientas nuevas con casos simples.
5. Documentar limitaciones o trabajo pendiente.

Salida esperada:

1. Primera etapa usable y evaluable por el equipo.

## Definicion de terminado

La primera etapa se considera terminada cuando:

1. El servidor soporta `shared` y `dragon2028` ademas de las lineas existentes.
2. Existe conocimiento compartido FoxPro consultable por recursos.
3. Existe conocimiento inicial de Organic y Dragon2028 consultable por recursos.
4. Existen prompts especializados alineados a esos contextos.
5. Existe al menos una herramienta de validacion FoxPro funcionando.
6. La solucion compila o al menos no introduce errores estructurales nuevos.

## Criterios de calidad

1. Cambios minimos, focalizados y consistentes con la arquitectura existente.
2. Sin duplicacion innecesaria entre `shared`, `organic` y `dragon2028`.
3. Sin mezclar reglas monoliticas de Organic con reglas modulares de Dragon2028.
4. Con ejemplos claros y reutilizables para grounding.
5. Con nombres de recursos, prompts y herramientas estables y comprensibles.

## Prompt sugerido para ejecutar el plan

```text
Implementa la primera etapa de evolucion de este servidor MCP para incorporar conocimiento compartido y especializado de Organic y Dragon2028.

Objetivos obligatorios:
1. Extender el modelo actual para soportar `shared` y `dragon2028` sin romper innecesariamente la compatibilidad con `businessLine`.
2. Incorporar una estructura de conocimiento compartido en `src/knowledge/shared` con estandares FoxPro base.
3. Incorporar conocimiento inicial de Organic y Dragon2028 en sus respectivas carpetas.
4. Exponer ese conocimiento mediante recursos MCP.
5. Extender los prompts contextuales y especializados para usar conocimiento `shared` mas conocimiento de linea.
6. Implementar al menos una herramienta de validacion FoxPro y una herramienta de asistencia estructural.

Reglas de negocio y codificacion que deben convertirse en conocimiento y, cuando aplique, en validacion:
- Nombres de clases, objetos, funciones y propiedades sin caracteres especiales dependientes del idioma.
- Identacion obligatoria con tabuladores.
- Cuerpo de clase, funcion y procedimiento con criterio uniforme de identacion.
- Si una logica condicional supera 3 condiciones, refactorizar hacia `do case`.
- Parametros con prefijo `t` + tipo.
- Variables locales declaradas como minimo con `local`, con prefijo `l` + tipo.
- Maximo 50 lineas por funcion, procedimiento o metodo.
- Maximo 3 niveles de identacion.
- Retorno tipado obligatorio y variable local de retorno acorde al tipo.
- Uso de `NOTE` como comentario multilinea en la primera linea luego de la firma cuando corresponda.

Reglas especificas de Organic:
- `Nucleo` contiene servicios base.
- `Dibujante` contiene interfaz.
- `Generadores` genera codigo desde DBF.
- `Felino` contiene reglas de negocio base y entidades compartidas entre productos.
- Las especializaciones por producto deben heredar de la entidad base.
- Los archivos `din_*.prg` no deben modificarse.

Reglas especificas de Dragon2028:
- `Organic.Core` es la base.
- `Organic.Drawing` depende de `Organic.Core`.
- `Organic.Generator` depende de `Organic.Core` y `Organic.Drawing`.
- `Organic.Feline` depende de `Organic.Core` y `Organic.Drawing`, pero no de `Organic.Generator` en forma directa.
- `Organic.Dragonfish` y `Organic.ZL` heredan desde `Organic.Feline`.
- No debe haber referencias cruzadas invalidas.
- Las definiciones DBF deben migrar a XML.
- Las propiedades usadas en entidades mediante `this.` o `.` dentro de `with this` deben declararse en el cuerpo de la clase.

Instrucciones de ejecucion:
1. Revisa primero los tipos, handlers y utilidades actuales para detectar puntos a extender.
2. Implementa cambios minimos y coherentes, priorizando resolver el modelo de contexto antes de agregar contenido masivo.
3. Usa recursos para conocimiento canonico, prompts para razonamiento guiado y herramientas para validacion o transformacion deterministica.
4. Agrega o actualiza documentacion solo donde aporte a la operacion de esta etapa.
5. Verifica build o errores relevantes al final.

Resultado esperado:
- Cambios de codigo necesarios en el servidor MCP.
- Nuevos archivos de conocimiento en `src/knowledge/shared`, `src/knowledge/organic` y `src/knowledge/dragon2028`.
- Recursos, prompts y herramientas funcionales para esta primera etapa.
- Resumen final breve con lo implementado, verificaciones ejecutadas y pendientes.
```

## Cierre

Este plan de ejecucion esta pensado para convertirse directamente en prompt de trabajo. La clave es ejecutar en ese orden: primero modelo de contexto, despues conocimiento, luego exposicion MCP y por ultimo herramientas. Si se invierte ese orden, el resultado tiende a quedar inconsistente o duplicado.