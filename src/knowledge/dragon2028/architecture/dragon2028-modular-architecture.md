---
id: dragon2028-modular-architecture
title: Arquitectura Modular Dragon2028
description: Principios base de ownership, dependencias permitidas y aislamiento entre modulos en Dragon2028.
tags: [dragon2028, architecture, modules, dependencies, xml]
version: 1.0.0
relatedItems: [dragon2028-module-boundaries, dragon2028-dbf-to-xml-migration]
---

# Arquitectura modular Dragon2028

## Principios

- Cada modulo tiene ownership claro sobre sus entidades y definiciones.
- Las dependencias entre modulos deben ser explicitas y permitidas.
- No se aceptan referencias cruzadas invalidas por conveniencia.

## Decisiones estructurales

- Logica de modulo dentro del modulo propietario.
- Definiciones de entidad en XML dentro del modulo correspondiente.
- Adaptadores o integraciones en puntos controlados, no dispersos.

## Señales de riesgo

- Un modulo lee metadata de otro sin contrato claro.
- Una entidad depende de propiedades no declaradas.
- La migracion DBF a XML se hace mezclando fuentes de verdad.
