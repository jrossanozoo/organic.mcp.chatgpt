import {
  BUSINESS_LINES,
  BusinessLine,
  ContextPrompt,
  KnowledgeItem,
  ProjectContext
} from '../types';
import { KnowledgeSearch } from '../utils/knowledge-search';

export type SpecificPromptType =
  | 'architecture'
  | 'debugging'
  | 'testing'
  | 'security'
  | 'performance'
  | 'test-generation'
  | 'lambda-generation'
  | 'foxpro-refactor'
  | 'foxpro-note'
  | 'entity-location'
  | 'dragon-architecture'
  | 'dbf-to-xml-migration';

/**
 * Manejador de prompts contextuales para diferentes líneas de negocio.
 */
export class PromptsHandler {
  private knowledgeSearch: KnowledgeSearch;

  private basePrompts: Record<BusinessLine, string> = {
    shared: `
Eres un asistente de programación especializado en estándares FoxPro compartidos.

REGLAS TRANSVERSALES:
- Usa tabuladores para la identación.
- Mantén máximo 3 niveles de identación y 50 líneas por unidad funcional.
- Declara parámetros con prefijo t + tipo y locales con prefijo l + tipo.
- Si una condición supera 3 ramas lógicas, refactoriza hacia do case.
- Devuelve resultados desde una variable local tipada y usa NOTE como comentario multilinea cuando aporte contexto funcional.

OBJETIVO:
- Resolver problemas con criterios deterministas, consistentes y reutilizables entre líneas.
- Diferenciar claramente entre conocimiento compartido y conocimiento específico de producto.
`,

    organic: `
Eres un asistente de programación especializado en ORGANIC.

MODELO ORGANIC:
- Nucleo contiene servicios base y configuración troncal.
- Dibujante contiene interfaz, formularios y reportes.
- Generadores produce código y artefactos desde definiciones DBF.
- Felino concentra reglas de negocio base y entidades compartidas entre productos.
- Las especializaciones por producto deben heredar de una entidad base.
- Los archivos din_*.prg no se modifican manualmente.

FORMA DE TRABAJO:
- Combina primero conocimiento shared de FoxPro y después reglas específicas de Organic.
- Si algo parece generado, localiza la fuente de verdad antes de proponer cambios.
- Sugiere ubicación concreta de la solución dentro del monolito.
`,

    lince: `
Eres un asistente de programación especializado en LINCE.

PRIORIDADES LINCE:
- Prioriza performance, baja latencia y velocidad de entrega.
- Mantén compatibilidad con estándares compartidos de FoxPro cuando apliquen.
- Optimiza sin sacrificar claridad en puntos críticos del flujo.

FORMA DE TRABAJO:
- Consulta primero conocimiento shared y luego patrones específicos de Lince.
- Propón soluciones medibles y observables.
`,

    dragon2028: `
Eres un asistente de programación especializado en DRAGON2028.

MODELO DRAGON2028:
- La arquitectura es modular y las dependencias entre módulos deben ser explícitas y permitidas.
- No se aceptan referencias cruzadas inválidas entre módulos.
- La migración de definiciones DBF a XML es parte del diseño objetivo.
- Las entidades deben declarar sus propiedades de forma explícita.
- NOTE se usa para documentar intención técnica y decisiones de migración.

FORMA DE TRABAJO:
- Combina estándares shared de FoxPro con conocimiento modular específico de Dragon2028.
- Evalúa siempre impacto de una decisión sobre límites de módulo, definiciones XML y migración.
`
  };

  constructor(knowledgeSearch: KnowledgeSearch) {
    this.knowledgeSearch = knowledgeSearch;
  }

  /**
   * Obtiene el prompt contextual para una línea de negocio específica.
   */
  async getContextPrompt(
    businessLine: BusinessLine,
    projectContext?: ProjectContext,
    includeKnowledge: boolean = true
  ): Promise<ContextPrompt> {
    let prompt = this.basePrompts[businessLine];
    const includedKnowledge: string[] = [];
    const appliedLines = this.getAppliedLines(businessLine);

    if (includeKnowledge) {
      const knowledgeSection = await this.buildKnowledgeSection(businessLine, projectContext);
      if (knowledgeSection) {
        prompt += `\n\n${knowledgeSection}`;
        includedKnowledge.push('shared-standards', 'line-architecture', 'line-patterns', 'best-practices');
      }
    }

    if (projectContext) {
      prompt += `\n\n${this.buildProjectSection(projectContext)}`;
    }

    return {
      businessLine,
      prompt,
      variables: this.extractVariables(prompt),
      includedKnowledge,
      appliedLines
    };
  }

  /**
   * Obtiene un prompt específico para una funcionalidad.
   */
  async getSpecificPrompt(
    businessLine: BusinessLine,
    promptType: SpecificPromptType,
    context?: string
  ): Promise<string> {
    const basePrompt = await this.getContextPrompt(businessLine);

    const specificPrompts: Record<SpecificPromptType, string> = {
      architecture: `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - ARQUITECTURA:
- Evalua limites de capa y responsabilidad antes de proponer cambios.
- Favorece cambios pequenos y verificables.
- Si detectas codigo generado o derivado de metadata, trabaja sobre la fuente de verdad.
`,

      debugging: `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - DEBUGGING:
- Aisla primero si el problema pertenece a shared, a la linea o al artefacto generado.
- Explica evidencia tecnica y causa raiz antes de sugerir cambios.
- Si la falla involucra modulos o capas, verifica fronteras antes de tocar implementacion.
`,

      testing: `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - TESTING:
- Diseña pruebas alineadas con la capa donde vive la responsabilidad.
- Valida reglas compartidas de FoxPro y reglas especificas de linea.
- Cubre casos de borde relacionados con generated code, herencia o limites modulares.
`,

      security: `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - SEGURIDAD:
- Revisa integridad de entradas, acceso a datos y aislamiento entre modulos o capas.
- No confundas velocidad con ausencia de validaciones en rutas criticas.
- Documenta restricciones estructurales que protegen el sistema.
`,

      performance: `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - PERFORMANCE:
- Optimiza respetando capa, ownership y fuente de verdad.
- Evita mejoras que mezclen responsabilidades o creen acoplamiento transversal.
- En FoxPro, privilegia cambios simples y medibles.
`,

      'test-generation': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - GENERACION DE TESTS:
- Genera estructura de test coherente con la capa destino.
- Refleja convenciones shared de FoxPro cuando aplique.
- Incluye Arrange, Act y Assert con nombres claros y setup minimo.
`,

      'lambda-generation': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - GENERACION LAMBDA:
- Aplica el conocimiento de linea solo cuando el contexto realmente sea serverless o integrador.
- Mantiene responsabilidades acotadas, validacion de entrada y trazabilidad.
`,

      'foxpro-refactor': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - REFACTORIZACION ESTRUCTURAL FOXPRO:
- Identifica si el cambio pertenece a shared, a una capa del monolito Organic o a un modulo Dragon2028.
- Si una funcion excede complejidad, divide por responsabilidad y usa do case cuando la condicion tenga mas de 3 ramas.
- No propongas editar din_*.prg; mueve el cambio a la clase base, subclase o metadata correcta.
`,

      'foxpro-note': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - DOCUMENTACION NOTE:
- Usa NOTE para explicar intencion funcional, restricciones y origen del comportamiento.
- Ubica NOTE inmediatamente despues de la firma cuando aporte valor real.
- Resume entrada, salida, invariantes y dependencias importantes en lenguaje tecnico concreto.
`,

      'entity-location': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - UBICACION DE ENTIDADES:
- En Organic, entidades base y reglas compartidas van en Felino; servicios base en Nucleo; UI en Dibujante; generacion en Generadores.
- En Dragon2028, decide primero el modulo propietario y luego si la definicion vive en DBF, XML o codigo de soporte.
- Prefiere herencia o extension antes que duplicacion entre productos.
`,

      'dragon-architecture': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - ARQUITECTURA DRAGON2028:
- Verifica dependencias permitidas entre modulos.
- Rechaza referencias cruzadas invalidas aunque parezcan convenientes.
- Aclara donde debe vivir cada definicion: modulo, metadata XML o soporte compartido.
`,

      'dbf-to-xml-migration': `
${basePrompt.prompt}

ENFOQUE ESPECIFICO - MIGRACION DBF A XML:
- Trata DBF como origen heredado y XML como definicion destino.
- Mapea propiedades de entidad de forma explicita y verificable.
- Documenta NOTE con supuestos, equivalencias y pendientes de migracion.
`
    };

    let specificPrompt = specificPrompts[promptType];
    if (context) {
      specificPrompt += `\n\nCONTEXTO ADICIONAL:\n${context}`;
    }

    return specificPrompt;
  }

  /**
   * Lista todos los prompts disponibles.
   */
  getAvailablePrompts(): Array<{
    name: string;
    description: string;
    businessLines: BusinessLine[];
  }> {
    return [
      {
        name: 'context-prompt',
        description: 'Prompt contextual base para la línea detectada',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'architecture-prompt',
        description: 'Prompt especializado en decisiones arquitectónicas',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'debugging-prompt',
        description: 'Prompt para análisis y resolución de problemas',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'testing-prompt',
        description: 'Prompt para estrategias de testing y calidad',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'security-prompt',
        description: 'Prompt para mejores prácticas de seguridad',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'performance-prompt',
        description: 'Prompt para optimización y performance',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'test-generation-prompt',
        description: 'Prompt especializado para generación de estructuras de test',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'lambda-generation-prompt',
        description: 'Prompt especializado para generación de funciones lambda',
        businessLines: [...BUSINESS_LINES]
      },
      {
        name: 'foxpro-refactor-prompt',
        description: 'Prompt para refactorización estructural FoxPro',
        businessLines: ['shared', 'organic', 'lince', 'dragon2028']
      },
      {
        name: 'foxpro-note-prompt',
        description: 'Prompt para documentar NOTE de manera consistente',
        businessLines: ['shared', 'organic', 'lince', 'dragon2028']
      },
      {
        name: 'entity-location-prompt',
        description: 'Prompt para ubicar entidades y responsabilidades',
        businessLines: ['organic', 'dragon2028']
      },
      {
        name: 'dragon-architecture-prompt',
        description: 'Prompt para decisiones modulares de Dragon2028',
        businessLines: ['dragon2028']
      },
      {
        name: 'dbf-to-xml-migration-prompt',
        description: 'Prompt para migración estructurada de DBF a XML',
        businessLines: ['dragon2028']
      }
    ];
  }

  private async buildKnowledgeSection(
    businessLine: BusinessLine,
    projectContext?: ProjectContext
  ): Promise<string> {
    const sections: string[] = [];

    const standards = await this.knowledgeSearch.getCombinedKnowledgeByCategory(businessLine, 'standards');
    sections.push(
      this.formatKnowledgeList('ESTANDARES SHARED', standards.shared, 4),
      this.formatKnowledgeList(
        `ESTANDARES ${businessLine.toUpperCase()}`,
        standards.line,
        4
      )
    );

    const patterns = await this.knowledgeSearch.getCombinedKnowledgeByCategory(businessLine, 'patterns');
    sections.push(
      this.formatKnowledgeList('PATRONES SHARED', patterns.shared, 3),
      this.formatKnowledgeList(
        `PATRONES ${businessLine.toUpperCase()}`,
        patterns.line,
        3
      )
    );

    const architecture = await this.knowledgeSearch.getCombinedKnowledgeByCategory(businessLine, 'architecture');
    sections.push(
      this.formatKnowledgeList(
        `ARQUITECTURA ${businessLine.toUpperCase()}`,
        architecture.line,
        3
      )
    );

    const bestPractices = await this.getRelevantBestPractices(businessLine, projectContext);
    const groupedBestPractices = this.partitionItems(bestPractices);
    sections.push(
      this.formatKnowledgeList('MEJORES PRACTICAS SHARED', groupedBestPractices.shared, 4),
      this.formatKnowledgeList(
        `MEJORES PRACTICAS ${businessLine.toUpperCase()}`,
        groupedBestPractices.line,
        4
      )
    );

    return sections.filter(Boolean).join('\n\n');
  }

  private buildProjectSection(projectContext: ProjectContext): string {
    const lines = [
      'CONTEXTO DEL PROYECTO ACTUAL:',
      `- Línea: ${projectContext.line.toUpperCase()}`,
      `- Compatibilidad businessLine: ${projectContext.businessLine.toUpperCase()}`,
      `- Ruta del proyecto: ${projectContext.projectPath}`,
      `- Confianza de detección: ${(projectContext.confidence * 100).toFixed(1)}%`
    ];

    if (projectContext.projectType) {
      lines.push(`- Tipo de proyecto: ${projectContext.projectType}`);
    }
    if (projectContext.layer) {
      lines.push(`- Capa detectada: ${projectContext.layer}`);
    }
    if (projectContext.product) {
      lines.push(`- Producto o módulo: ${projectContext.product}`);
    }
    if (projectContext.artifactType) {
      lines.push(`- Tipo de artefacto: ${projectContext.artifactType}`);
    }
    if (projectContext.technologies.length > 0) {
      lines.push(`- Tecnologías detectadas: ${projectContext.technologies.join(', ')}`);
    }

    lines.push('- Aplica shared primero y luego las reglas específicas de línea y capa.');
    return lines.join('\n');
  }

  private extractVariables(prompt: string): Record<string, string> {
    const variables: Record<string, string> = {};
    const variableRegex = /\{\{(\w+)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = variableRegex.exec(prompt)) !== null) {
      variables[match[1]] = '';
    }

    return variables;
  }

  private getAppliedLines(businessLine: BusinessLine): BusinessLine[] {
    return businessLine === 'shared' ? ['shared'] : ['shared', businessLine];
  }

  private formatKnowledgeList(title: string, items: KnowledgeItem[], limit: number): string {
    if (items.length === 0) {
      return '';
    }

    return `${title}:\n${items.slice(0, limit).map(item => `- ${item.title}: ${item.description || item.content.split('\n')[0]}`).join('\n')}`;
  }

  private partitionItems(items: KnowledgeItem[]): { shared: KnowledgeItem[]; line: KnowledgeItem[] } {
    return {
      shared: items.filter(item => item.businessLine === 'shared'),
      line: items.filter(item => item.businessLine !== 'shared')
    };
  }

  private async getRelevantBestPractices(
    businessLine: BusinessLine,
    projectContext?: ProjectContext
  ): Promise<KnowledgeItem[]> {
    if (projectContext?.technologies && projectContext.technologies.length > 0) {
      const results = await Promise.all(
        projectContext.technologies.map(technology =>
          this.knowledgeSearch.getBestPractices(
            businessLine,
            technology,
            businessLine !== 'shared'
          )
        )
      );

      const flattened = results.flat();
      if (flattened.length > 0) {
        return this.deduplicate(flattened);
      }
    }

    return this.knowledgeSearch.getBestPractices(
      businessLine,
      undefined,
      businessLine !== 'shared'
    );
  }

  private deduplicate(items: KnowledgeItem[]): KnowledgeItem[] {
    const map = new Map<string, KnowledgeItem>();

    for (const item of items) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }

    return Array.from(map.values());
  }
}