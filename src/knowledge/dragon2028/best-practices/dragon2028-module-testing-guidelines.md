---
id: dragon2028-module-testing-guidelines
title: Dragon2028 Module Testing Guidelines
description: Buenas practicas iniciales para probar ownership de modulo, contratos XML y restricciones de migracion.
tags: [dragon2028, best-practices, testing, modules, xml]
version: 1.0.0
relatedItems: [dragon2028-module-boundaries]
---

# Dragon2028 module testing guidelines

## Que validar

- El modulo propietario resuelve su entidad sin leer internamente otro modulo.
- Las propiedades XML declaradas cubren el contrato esperado.
- Los supuestos de migracion DBF a XML quedan visibles en NOTE o fixtures.

## Buenas practicas

- Fixtures chicos por modulo.
- Casos de error para dependencias invalidas.
- Casos de consistencia entre DBF heredado y XML destino.
