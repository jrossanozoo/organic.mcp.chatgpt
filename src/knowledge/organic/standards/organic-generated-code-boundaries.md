---
id: organic-generated-code-boundaries
title: Limites de Codigo Generado en Organic
description: Regla explicita para no modificar din_*.prg y para ubicar el cambio en metadata, generadores o extensiones de negocio.
tags: [organic, standards, generated-code, din, foxpro]
version: 1.0.0
relatedItems: [organic-monolith-responsibilities, organic-entity-specialization]
---

# Limites de codigo generado en Organic

## Regla obligatoria

- No modificar manualmente archivos `din_*.prg`.

## Fuente de verdad

- Si el comportamiento proviene de DBF o plantillas: corregir en Generadores o metadata.
- Si el comportamiento debe variar por producto: extender desde la clase base en Felino.
- Si el cambio es visual: resolverlo en Dibujante sin tocar el archivo generado.

## Decision rapida

1. Identificar si el archivo es generado.
2. Localizar la metadata o plantilla fuente.
3. Solo si corresponde, mover la variacion a una subclase o extension manual.
