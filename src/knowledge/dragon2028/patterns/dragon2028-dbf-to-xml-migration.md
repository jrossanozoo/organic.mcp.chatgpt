---
id: dragon2028-dbf-to-xml-migration
title: Migracion DBF a XML en Dragon2028
description: Patron inicial para migrar definiciones DBF a XML con trazabilidad y propiedades explicitas.
tags: [dragon2028, patterns, dbf, xml, migration]
version: 1.0.0
relatedItems: [dragon2028-modular-architecture, dragon2028-module-boundaries]
---

# Migracion DBF a XML en Dragon2028

## Objetivo

Transformar una definicion DBF heredada en una definicion XML verificable y versionable.

## Pasos minimos

1. Identificar la entidad propietaria y el modulo destino.
2. Enumerar campos DBF y mapearlos a propiedades XML explicitas.
3. Documentar en NOTE las equivalencias, supuestos y faltantes.
4. Validar que el modulo consumidor solo dependa del contrato XML resultante.

## Ejemplo base

```xml
<entity name="Articulo">
	<property name="codigo" type="character" required="true" />
	<property name="descripcion" type="character" required="true" />
	<property name="activo" type="logical" required="true" default="true" />
</entity>
```

## NOTE recomendado

```foxpro
NOTE
	Migracion inicial de Articulo desde DBF a XML.
	El campo cod_articulo pasa a codigo.
	Pendiente revisar longitudes historicas y valores por defecto.
EndNote
```
