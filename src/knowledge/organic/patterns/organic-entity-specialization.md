---
id: organic-entity-specialization
title: Especializacion de Entidades Organic
description: Patron canonico para heredar entidades base en Felino y extenderlas por producto sin duplicacion.
tags: [organic, patterns, foxpro, entities, inheritance, felino]
version: 1.0.0
relatedItems: [organic-monolith-responsibilities, organic-generated-code-boundaries]
---

# Especializacion de entidades Organic

## Regla base

- La entidad base vive en Felino.
- Las especializaciones por producto heredan desde esa entidad base.
- La extension agrega comportamiento del producto sin copiar la logica comun.

## Ejemplo canonico

```foxpro
Define Class EntidadBase as Custom
	Function Validar
		Local llValida
		llValida = .T.
		Return llValida
	EndFunc
EndDefine

Define Class EntidadProducto as EntidadBase
	Function Validar
		Local llValida
		llValida = Dodefault()
		If llValida
			llValida = This.ValidarRestriccionDeProducto()
		EndIf
		Return llValida
	EndFunc
EndDefine
```

## Cuando no usarlo

- Cuando el comportamiento no es reusable y solo pertenece a una UI.
- Cuando el cambio corresponde al generador y no a la entidad resultante.
