---
id: shared-foxpro-testing-and-note-guidelines
title: FoxPro Testing and NOTE Guidelines
description: Guias compartidas de testing FoxPro y documentacion NOTE para prompts, recursos y validaciones.
tags: [shared, foxpro, testing, note, best-practices]
version: 1.0.0
relatedItems: [shared-foxpro-coding-standards]
---

# FoxPro testing and NOTE guidelines

## Testing compartido

- Preferir nombres descriptivos con prefijo `zTestU_` para unit tests.
- Mantener fixtures minimos y deterministas.
- Validar el resultado principal y una condicion estructural relevante.
- Evitar conocimiento especifico de una linea cuando el caso de prueba es shared.

## Uso de NOTE

- Ubicar `NOTE` inmediatamente despues de la firma cuando explique una decision relevante.
- Documentar entrada, salida, restricciones y origen de la regla.
- No usar NOTE para repetir lo obvio ni para reemplazar nombres claros.

## Ejemplo de NOTE util

```foxpro
Function ValidarConvencion(tcNombre)
	NOTE
		Valida una convencion shared reutilizada por varias lineas.
		Entrada: nombre de simbolo.
		Salida: .T. si cumple prefijos tipados.
	EndNote

	Local llValido
	llValido = !Empty(tcNombre)
	Return llValido
EndFunc
```
