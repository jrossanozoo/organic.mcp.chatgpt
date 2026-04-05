import { ArtifactType, BusinessLine, ContextLayer, ProjectContext } from '../types';

export interface FoxProValidationIssue {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  severity: 'error' | 'warning' | 'info';
  message: string;
  lines?: number[];
  recommendation?: string;
  details?: string[];
}

export interface FoxProValidationReport {
  businessLine: BusinessLine;
  summary: {
    score: number;
    passed: number;
    failed: number;
    warnings: number;
    analyzedBlocks: number;
  };
  analyzedBlocks: Array<{
    name: string;
    kind: 'function' | 'procedure' | 'snippet';
    startLine: number;
    endLine: number;
    length: number;
  }>;
  checks: FoxProValidationIssue[];
}

export interface LayerSuggestionInput {
  businessLine: BusinessLine;
  projectContext?: ProjectContext;
  artifactType?: ArtifactType;
  problemType?: string;
  entityName?: string;
  description?: string;
  currentPath?: string;
}

export interface LayerSuggestionResult {
  businessLine: BusinessLine;
  recommendedLayer: ContextLayer;
  canonicalLocation: string;
  reason: string;
  constraints: string[];
  alternatives: Array<{
    layer: ContextLayer;
    canonicalLocation: string;
    when: string;
  }>;
}

type FoxProBlock = {
  name: string;
  kind: 'function' | 'procedure' | 'snippet';
  startLine: number;
  endLine: number;
  params: string[];
  lines: string[];
};

/**
 * Valida estándares FoxPro de forma determinista usando heurísticas estructurales simples.
 */
export function validateFoxProStandards(code: string, businessLine: BusinessLine): FoxProValidationReport {
  const lines = normalizeCode(code);
  const blocks = extractBlocks(lines);
  const checks: FoxProValidationIssue[] = [];

  checks.push(validateTabsIndentation(lines));
  checks.push(validateIndentationDepth(lines));
  checks.push(validateLocalDeclarations(blocks));
  checks.push(validateParameterNaming(blocks));
  checks.push(validateLocalNaming(blocks));
  checks.push(validateReturnConvention(blocks));
  checks.push(validateBlockLength(blocks));
  checks.push(validateConditionalComplexity(lines));
  checks.push(validateNotePlacement(blocks));

  const failed = checks.filter(check => check.status === 'failed').length;
  const warnings = checks.filter(check => check.status === 'warning').length;
  const passed = checks.filter(check => check.status === 'passed').length;
  const score = Math.max(0, Math.round(((passed + warnings * 0.5) / checks.length) * 100));

  return {
    businessLine,
    summary: {
      score,
      passed,
      failed,
      warnings,
      analyzedBlocks: blocks.length
    },
    analyzedBlocks: blocks.map(block => ({
      name: block.name,
      kind: block.kind,
      startLine: block.startLine,
      endLine: block.endLine,
      length: block.endLine - block.startLine + 1
    })),
    checks
  };
}

/**
 * Sugiere la capa y ubicación más razonable para una solución según línea y artefacto.
 */
export function suggestSolutionLayer(input: LayerSuggestionInput): LayerSuggestionResult {
  const businessLine = input.projectContext?.line || input.businessLine;
  const artifactType = input.projectContext?.artifactType || input.artifactType;
  const summary = [
    input.problemType || '',
    input.entityName || '',
    input.description || '',
    input.currentPath || ''
  ].join(' ').toLowerCase();

  if (businessLine === 'organic') {
    return suggestOrganicLayer(summary, artifactType);
  }

  if (businessLine === 'dragon2028') {
    return suggestDragonLayer(summary, artifactType);
  }

  if (businessLine === 'shared') {
    return {
      businessLine,
      recommendedLayer: 'shared',
      canonicalLocation: 'shared',
      reason: 'El problema describe una regla transversal reutilizable entre líneas, por lo que debe vivir en conocimiento o utilidades shared.',
      constraints: [
        'No duplicar conocimiento transversal dentro de cada línea.',
        'Mantener reglas FoxPro comunes aisladas de decisiones específicas de producto.'
      ],
      alternatives: [
        {
          layer: 'core',
          canonicalLocation: 'Nucleo',
          when: 'Solo si la regla necesita implementación concreta en un monolito y deja de ser transversal.'
        }
      ]
    };
  }

  return {
    businessLine,
    recommendedLayer: 'core',
    canonicalLocation: 'Nucleo',
    reason: 'No hay señales suficientes de UI, generación o módulo; la opción más segura es una implementación base en la capa core.',
    constraints: [
      'Mantener consistencia con estándares shared.',
      'Evitar mezclar responsabilidad de negocio con infraestructura.'
    ],
    alternatives: [
      {
        layer: 'business',
        canonicalLocation: 'Felino',
        when: 'Si termina siendo una regla de negocio compartida o una entidad base.'
      }
    ]
  };
}

function normalizeCode(code: string): string[] {
  return code.replace(/\r\n/g, '\n').split('\n');
}

function extractBlocks(lines: string[]): FoxProBlock[] {
  const blocks: FoxProBlock[] = [];
  const startRegex = /^\s*(function|procedure)\s+([a-z_][a-z0-9_]*)\s*(?:\(([^)]*)\))?/i;
  const endRegex = /^\s*(endfunc|endproc)\b/i;
  let current: FoxProBlock | null = null;

  lines.forEach((line, index) => {
    const startMatch = line.match(startRegex);
    if (startMatch && !current) {
      current = {
        name: startMatch[2],
        kind: startMatch[1].toLowerCase() === 'function' ? 'function' : 'procedure',
        startLine: index + 1,
        endLine: index + 1,
        params: parseParams(startMatch[3] || ''),
        lines: [line]
      };
      return;
    }

    if (current) {
      current.lines.push(line);
      current.endLine = index + 1;

      if (endRegex.test(line)) {
        blocks.push(current);
        current = null;
      }
    }
  });

  if (current) {
    blocks.push(current);
  }

  if (blocks.length === 0) {
    blocks.push({
      name: 'snippet',
      kind: 'snippet',
      startLine: 1,
      endLine: lines.length,
      params: [],
      lines
    });
  }

  return blocks;
}

function parseParams(rawParams: string): string[] {
  return rawParams
    .split(',')
    .map(param => param.trim())
    .filter(Boolean);
}

function validateTabsIndentation(lines: string[]): FoxProValidationIssue {
  const offendingLines = lines
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(entry => /^ +\S/.test(entry.line))
    .map(entry => entry.index);

  if (offendingLines.length > 0) {
    return {
      id: 'tabs-indentation',
      title: 'Identación con tabs',
      status: 'failed',
      severity: 'error',
      message: 'Se encontraron líneas con indentación por espacios.',
      lines: offendingLines,
      recommendation: 'Reemplaza espacios iniciales por tabuladores en las líneas indicadas.'
    };
  }

  return {
    id: 'tabs-indentation',
    title: 'Identación con tabs',
    status: 'passed',
    severity: 'info',
    message: 'No se detectaron líneas identadas con espacios.'
  };
}

function validateIndentationDepth(lines: string[]): FoxProValidationIssue {
  const offendingLines = lines
    .map((line, index) => ({ line, index: index + 1, depth: countLeadingTabs(line) }))
    .filter(entry => entry.depth > 3);

  if (offendingLines.length > 0) {
    return {
      id: 'max-indentation-depth',
      title: 'Máximo 3 niveles de identación',
      status: 'failed',
      severity: 'error',
      message: 'Hay líneas con más de 3 niveles de identación.',
      lines: offendingLines.map(entry => entry.index),
      details: offendingLines.map(entry => `Línea ${entry.index}: profundidad ${entry.depth}`),
      recommendation: 'Extrae lógica o usa do case para reducir anidación.'
    };
  }

  return {
    id: 'max-indentation-depth',
    title: 'Máximo 3 niveles de identación',
    status: 'passed',
    severity: 'info',
    message: 'La profundidad de identación se mantiene dentro del límite.'
  };
}

function validateLocalDeclarations(blocks: FoxProBlock[]): FoxProValidationIssue {
  const missingLocal = blocks
    .filter(block => block.kind !== 'snippet')
    .filter(block => !block.lines.some(line => /^\s*local\s+/i.test(line)));

  if (missingLocal.length > 0) {
    return {
      id: 'local-declaration',
      title: 'Declaración local obligatoria',
      status: 'failed',
      severity: 'error',
      message: 'Hay bloques sin declaración local.',
      details: missingLocal.map(block => `${block.name} (${block.startLine}-${block.endLine})`),
      recommendation: 'Declara variables locales con local al inicio de cada función o procedimiento.'
    };
  }

  return {
    id: 'local-declaration',
    title: 'Declaración local obligatoria',
    status: 'passed',
    severity: 'info',
    message: 'Todos los bloques analizados declaran variables locales.'
  };
}

function validateParameterNaming(blocks: FoxProBlock[]): FoxProValidationIssue {
  const invalidParams: string[] = [];

  for (const block of blocks) {
    for (const param of block.params) {
      if (!/^t[a-z][A-Z][A-Za-z0-9_]*$/.test(param)) {
        invalidParams.push(`${block.name}: ${param}`);
      }
    }
  }

  if (invalidParams.length > 0) {
    return {
      id: 'parameter-naming',
      title: 'Parámetros con prefijo t + tipo',
      status: 'failed',
      severity: 'error',
      message: 'Se detectaron parámetros fuera de la convención t + tipo.',
      details: invalidParams,
      recommendation: 'Usa nombres como tnTotal, tcCodigo o toEntidad.'
    };
  }

  return {
    id: 'parameter-naming',
    title: 'Parámetros con prefijo t + tipo',
    status: 'passed',
    severity: 'info',
    message: 'Los parámetros cumplen la convención tipada.'
  };
}

function validateLocalNaming(blocks: FoxProBlock[]): FoxProValidationIssue {
  const invalidLocals: string[] = [];

  for (const block of blocks) {
    const locals = extractLocals(block.lines);
    for (const localName of locals) {
      if (localName.toLowerCase() === 'this') {
        continue;
      }
      if (!/^l[a-z][A-Z][A-Za-z0-9_]*$/.test(localName)) {
        invalidLocals.push(`${block.name}: ${localName}`);
      }
    }
  }

  if (invalidLocals.length > 0) {
    return {
      id: 'local-naming',
      title: 'Locales con prefijo l + tipo',
      status: 'failed',
      severity: 'error',
      message: 'Se detectaron variables locales fuera de la convención l + tipo.',
      details: invalidLocals,
      recommendation: 'Usa nombres como lnTotal, lcNombre o loServicio.'
    };
  }

  return {
    id: 'local-naming',
    title: 'Locales con prefijo l + tipo',
    status: 'passed',
    severity: 'info',
    message: 'Las variables locales cumplen la convención tipada.'
  };
}

function validateReturnConvention(blocks: FoxProBlock[]): FoxProValidationIssue {
  const problems: string[] = [];

  for (const block of blocks) {
    if (block.kind !== 'function') {
      continue;
    }

    const locals = new Set(extractLocals(block.lines));
    const returnLine = block.lines.find(line => /^\s*return\s+/i.test(line));
    if (!returnLine) {
      problems.push(`${block.name}: no tiene return explícito`);
      continue;
    }

    const match = returnLine.match(/^\s*return\s+([A-Za-z_][A-Za-z0-9_]*)/i);
    if (!match) {
      problems.push(`${block.name}: el return no usa una variable local tipada`);
      continue;
    }

    const returnedValue = match[1];
    if (!/^l[a-z][A-Z][A-Za-z0-9_]*$/.test(returnedValue) || !locals.has(returnedValue)) {
      problems.push(`${block.name}: retorna ${returnedValue} y no una variable local tipada declarada`);
    }
  }

  if (problems.length > 0) {
    return {
      id: 'typed-return',
      title: 'Retorno por variable local tipada',
      status: 'failed',
      severity: 'error',
      message: 'Hay funciones que no retornan una variable local tipada.',
      details: problems,
      recommendation: 'Declara una variable local de retorno y úsala en el return final.'
    };
  }

  return {
    id: 'typed-return',
    title: 'Retorno por variable local tipada',
    status: 'passed',
    severity: 'info',
    message: 'Las funciones retornan mediante variables locales tipadas.'
  };
}

function validateBlockLength(blocks: FoxProBlock[]): FoxProValidationIssue {
  const longBlocks = blocks.filter(block => block.endLine - block.startLine + 1 > 50);

  if (longBlocks.length > 0) {
    return {
      id: 'max-block-length',
      title: 'Máximo 50 líneas por unidad',
      status: 'failed',
      severity: 'error',
      message: 'Se encontraron funciones o procedimientos con más de 50 líneas.',
      details: longBlocks.map(block => `${block.name}: ${block.endLine - block.startLine + 1} líneas`),
      recommendation: 'Divide la lógica en unidades más pequeñas y cohesivas.'
    };
  }

  return {
    id: 'max-block-length',
    title: 'Máximo 50 líneas por unidad',
    status: 'passed',
    severity: 'info',
    message: 'La longitud de los bloques analizados está dentro del límite.'
  };
}

function validateConditionalComplexity(lines: string[]): FoxProValidationIssue {
  const offending: Array<{ line: number; conditions: number }> = [];

  lines.forEach((rawLine, index) => {
    const line = stripInlineComment(rawLine);
    if (!/^\s*if\b/i.test(line)) {
      return;
    }

    const conditionCount = 1 + (line.match(/\b(and|or)\b/gi) || []).length;
    if (conditionCount > 3) {
      offending.push({ line: index + 1, conditions: conditionCount });
    }
  });

  if (offending.length > 0) {
    return {
      id: 'if-condition-complexity',
      title: 'Complejidad condicional máxima',
      status: 'failed',
      severity: 'error',
      message: 'Hay sentencias if con más de 3 condiciones.',
      lines: offending.map(entry => entry.line),
      details: offending.map(entry => `Línea ${entry.line}: ${entry.conditions} condiciones`),
      recommendation: 'Refactoriza la lógica condicional a do case o funciones auxiliares.'
    };
  }

  return {
    id: 'if-condition-complexity',
    title: 'Complejidad condicional máxima',
    status: 'passed',
    severity: 'info',
    message: 'No se detectaron if con exceso de condiciones.'
  };
}

function validateNotePlacement(blocks: FoxProBlock[]): FoxProValidationIssue {
  const missingNote = blocks
    .filter(block => block.kind !== 'snippet' && block.lines.length >= 8)
    .filter(block => {
      const nextLine = findNextNonEmptyLine(block.lines.slice(1));
      return !nextLine || !/^\s*note\b/i.test(nextLine);
    });

  if (missingNote.length > 0) {
    return {
      id: 'note-placement',
      title: 'NOTE funcional luego de la firma',
      status: 'warning',
      severity: 'warning',
      message: 'Hay bloques medianos o largos sin NOTE inmediatamente después de la firma.',
      details: missingNote.map(block => `${block.name} (${block.startLine}-${block.endLine})`),
      recommendation: 'Agrega NOTE al inicio del bloque cuando aporte contexto funcional o técnico relevante.'
    };
  }

  return {
    id: 'note-placement',
    title: 'NOTE funcional luego de la firma',
    status: 'passed',
    severity: 'info',
    message: 'La ubicación de NOTE es consistente en los bloques relevantes.'
  };
}

function extractLocals(lines: string[]): string[] {
  const locals: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*local\s+(.+)$/i);
    if (!match) {
      continue;
    }

    const declarations = match[1].split(',');
    for (const declaration of declarations) {
      const token = declaration.trim().split(/\s+as\s+|\s*=\s*/i)[0].trim();
      if (token) {
        locals.push(token);
      }
    }
  }

  return locals;
}

function countLeadingTabs(line: string): number {
  const match = line.match(/^(\t+)/);
  return match ? match[1].length : 0;
}

function stripInlineComment(line: string): string {
  return line.split('&&')[0];
}

function findNextNonEmptyLine(lines: string[]): string | null {
  for (const line of lines) {
    if (line.trim()) {
      return line;
    }
  }

  return null;
}

function suggestOrganicLayer(summary: string, artifactType?: ArtifactType): LayerSuggestionResult {
  if (artifactType === 'generated-foxpro' || summary.includes('din_')) {
    return {
      businessLine: 'organic',
      recommendedLayer: 'generators',
      canonicalLocation: 'Generadores o metadata DBF origen',
      reason: 'El cambio apunta a código generado; en Organic la corrección debe hacerse en el generador o en la metadata fuente, no en din_*.prg.',
      constraints: [
        'No modificar archivos din_*.prg.',
        'Si se necesita comportamiento por producto, extender desde la entidad o clase base.'
      ],
      alternatives: [
        {
          layer: 'business',
          canonicalLocation: 'Felino',
          when: 'Cuando el ajuste es una especialización de negocio y no un cambio de generación.'
        }
      ]
    };
  }

  if (/(ui|pantalla|form|vista|reporte|dibujante|scx|vcx|frx)/.test(summary)) {
    return {
      businessLine: 'organic',
      recommendedLayer: 'ui',
      canonicalLocation: 'Dibujante',
      reason: 'La solicitud apunta a interfaz, formularios o reportes, que en Organic pertenecen a Dibujante.',
      constraints: [
        'Mantener la lógica de negocio fuera de la UI.',
        'Usar Nucleo o Felino para dependencias compartidas.'
      ],
      alternatives: [
        {
          layer: 'core',
          canonicalLocation: 'Nucleo',
          when: 'Si solo falta un servicio de soporte reutilizable para la UI.'
        }
      ]
    };
  }

  if (/(generador|generator|template|dbf|codegen|metadata)/.test(summary)) {
    return {
      businessLine: 'organic',
      recommendedLayer: 'generators',
      canonicalLocation: 'Generadores',
      reason: 'La solicitud afecta generación de código o transformación desde DBF, responsabilidad directa de Generadores.',
      constraints: [
        'No mezclar generación con reglas de negocio permanentes.',
        'Mantener la fuente de verdad en metadata o plantillas.'
      ],
      alternatives: [
        {
          layer: 'business',
          canonicalLocation: 'Felino',
          when: 'Si el cambio es una regla base reutilizable por varias generaciones.'
        }
      ]
    };
  }

  if (/(entidad|entity|herencia|negocio|felino|producto|base)/.test(summary)) {
    return {
      businessLine: 'organic',
      recommendedLayer: 'business',
      canonicalLocation: 'Felino',
      reason: 'Las entidades base y reglas compartidas entre productos viven en Felino.',
      constraints: [
        'Las especializaciones por producto deben heredar de la entidad base.',
        'Evitar duplicar comportamiento entre productos.'
      ],
      alternatives: [
        {
          layer: 'core',
          canonicalLocation: 'Nucleo',
          when: 'Si el cambio es puramente un servicio técnico base sin semántica de negocio.'
        }
      ]
    };
  }

  return {
    businessLine: 'organic',
    recommendedLayer: 'core',
    canonicalLocation: 'Nucleo',
    reason: 'La solicitud encaja mejor como servicio base o infraestructura del monolito.',
    constraints: [
      'Mantener Nucleo libre de comportamiento específico de producto.',
      'Delegar entidades base y reglas de negocio a Felino cuando corresponda.'
    ],
    alternatives: [
      {
        layer: 'business',
        canonicalLocation: 'Felino',
        when: 'Si aparece una regla de negocio compartida o una entidad base.'
      },
      {
        layer: 'ui',
        canonicalLocation: 'Dibujante',
        when: 'Si el cambio termina siendo solamente visual o de interacción.'
      }
    ]
  };
}

function suggestDragonLayer(summary: string, artifactType?: ArtifactType): LayerSuggestionResult {
  if (artifactType === 'dbf-definition' || artifactType === 'xml-definition' || /(xml|dbf|schema|metadata|propiedad|migracion)/.test(summary)) {
    return {
      businessLine: 'dragon2028',
      recommendedLayer: 'data',
      canonicalLocation: 'Módulo propietario / definiciones XML',
      reason: 'La solicitud se relaciona con definiciones de entidad, metadata o migración DBF a XML.',
      constraints: [
        'Declarar propiedades de entidad de forma explícita.',
        'Documentar equivalencias y pendientes de migración.'
      ],
      alternatives: [
        {
          layer: 'module',
          canonicalLocation: 'Módulo propietario',
          when: 'Si además se requiere lógica de comportamiento o coordinación modular.'
        }
      ]
    };
  }

  return {
    businessLine: 'dragon2028',
    recommendedLayer: 'module',
    canonicalLocation: 'Módulo propietario',
    reason: 'La solicitud afecta ownership o dependencia entre módulos, por lo que debe resolverse en el módulo responsable.',
    constraints: [
      'No introducir referencias cruzadas inválidas entre módulos.',
      'Mantener dependencias permitidas y explícitas.'
    ],
    alternatives: [
      {
        layer: 'data',
        canonicalLocation: 'Definiciones XML del módulo',
        when: 'Si el problema termina siendo de esquema o declaración de propiedades.'
      }
    ]
  };
}