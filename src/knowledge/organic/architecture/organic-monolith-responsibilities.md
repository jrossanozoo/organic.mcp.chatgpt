---
id: organic-monolith-responsibilities
title: Responsabilidades del Monolito Organic
description: Define el rol de Nucleo, Dibujante, Generadores y Felino dentro del modelo monolitico Organic.
tags: [organic, architecture, foxpro, monolith, felino, nucleo]
version: 1.0.0
relatedItems: [organic-entity-specialization, organic-generated-code-boundaries]
---

# Responsabilidades del monolito Organic

## Nucleo

- Servicios base.
- Configuracion compartida.
- Infraestructura reusable.

## Dibujante

- Formularios, reportes y elementos visuales.
- Comportamiento de UI sin reglas de negocio persistentes.

## Generadores

- Generacion de codigo y artefactos desde DBF.
- Plantillas y procesos que producen `din_*.prg`.

## Felino

- Reglas de negocio base.
- Entidades compartidas entre productos.
- Punto de apoyo para herencia y especializacion.

## Regla de ubicacion

- Si el cambio es visual: Dibujante.
- Si el cambio es servicio base: Nucleo.
- Si el cambio altera codigo generado o metadata: Generadores.
- Si el cambio afecta entidades o negocio base: Felino.
