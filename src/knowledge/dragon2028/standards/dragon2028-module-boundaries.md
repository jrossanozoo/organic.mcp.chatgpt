---
id: dragon2028-module-boundaries
title: Limites y Estandares de Modulo Dragon2028
description: Reglas para dependencias permitidas, ausencia de referencias cruzadas invalidas y declaracion explicita de propiedades.
tags: [dragon2028, standards, modules, properties, boundaries]
version: 1.0.0
relatedItems: [dragon2028-modular-architecture, dragon2028-dbf-to-xml-migration]
---

# Limites y estandares de modulo Dragon2028

## Reglas obligatorias

1. Cada modulo declara sus dependencias permitidas.
2. No se introducen referencias cruzadas invalidas.
3. Toda entidad declara sus propiedades de forma explicita.
4. XML es la definicion destino cuando la migracion ya esta iniciada.

## Checklist

- Ownership claro del modulo.
- Propiedades declaradas una sola vez.
- Contratos de lectura y escritura visibles.
- NOTE con supuestos de migracion cuando corresponda.
