---
id: shared-foxpro-structural-refactoring
title: Refactorizacion Estructural FoxPro
description: Patrones compartidos para simplificar funciones FoxPro, reducir anidacion y separar responsabilidades.
tags: [shared, foxpro, patterns, refactoring, do-case]
version: 1.0.0
relatedItems: [shared-foxpro-coding-standards]
---

# Refactorizacion estructural FoxPro

## Cuando refactorizar

- La funcion supera 50 lineas.
- La identacion llega a 4 niveles o mas.
- Un `if` encadena mas de 3 condiciones.
- La misma responsabilidad mezcla validacion, calculo y persistencia.

## Patron recomendado

1. Extraer validaciones a una rutina corta.
2. Reemplazar `if` complejos por `do case` cuando la decision tenga varias ramas.
3. Mantener una sola variable de retorno tipada.
4. Dejar `NOTE` al inicio si la razon del algoritmo no es obvia.

## Ejemplo

```foxpro
Function ResolverEstado(tcTipo, tlActivo, tlBloqueado, tlTieneError)
	Local lcEstado

	Do Case
		Case tlTieneError
			lcEstado = "ERROR"
		Case tlBloqueado
			lcEstado = "BLOQUEADO"
		Case tlActivo
			lcEstado = "ACTIVO"
		Otherwise
			lcEstado = "INACTIVO"
	EndCase

	Return lcEstado
EndFunc
```

## Resultado esperado

- Menos anidacion.
- Ramas mas faciles de testear.
- Lectura mas rapida del flujo principal.
