---
id: shared-foxpro-coding-standards
title: Estandares FoxPro Compartidos
description: Reglas transversales de codificacion FoxPro aplicables a shared, Organic, Lince y Dragon2028.
tags: [shared, foxpro, standards, tabs, naming, return]
version: 1.0.0
relatedItems: [shared-foxpro-structural-refactoring, shared-foxpro-testing-and-note-guidelines]
---

# Estandares FoxPro compartidos

## Reglas obligatorias

1. Nombres de clases, objetos, funciones y propiedades sin caracteres especiales dependientes del idioma.
2. Identacion obligatoria con tabuladores.
3. Maximo 3 niveles de identacion dentro de una unidad funcional.
4. Maximo 50 lineas por funcion, procedimiento o metodo.
5. Parametros con prefijo `t` + tipo + nombre.
6. Variables locales con `local` y prefijo `l` + tipo + nombre.
7. Retorno mediante variable local tipada.
8. Si una condicion supera 3 ramas logicas, refactorizar hacia `do case`.
9. `NOTE` se usa como comentario multilinea funcional cuando agrega contexto real.

## Convenciones de nombres

- Parametros: `tnTotal`, `tcCodigo`, `tlActivo`, `toEntidad`.
- Locales: `lnResultado`, `lcMensaje`, `llValido`, `loServicio`.
- Retorno: `lnResultado`, `lcRespuesta`, `loEntidad`.

## Ejemplo canonico

```foxpro
Function CalcularSaldo(tcClienteId, tnLimite)
	NOTE
		Calcula saldo y retorna desde una variable local tipada.
	EndNote

	Local lnSaldo
	Local llAplicaTope
	Local lnResultado

	lnSaldo = This.ObtenerSaldo(tcClienteId)
	llAplicaTope = lnSaldo > tnLimite

	If llAplicaTope
		lnResultado = tnLimite
	Else
		lnResultado = lnSaldo
	EndIf

	Return lnResultado
EndFunc
```

## Señales de incumplimiento frecuentes

- Espacios en lugar de tabs al identar.
- Parametros como `clienteId` o `importe` sin prefijo tipado.
- `return` con literales o expresiones complejas en lugar de una variable local.
- `if` con demasiadas condiciones y varios niveles de anidacion.
