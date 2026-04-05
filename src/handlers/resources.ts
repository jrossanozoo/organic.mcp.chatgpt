import * as fs from 'fs-extra';
import * as path from 'path';
import {
  BUSINESS_LINES,
  BusinessLine,
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  ResourceInfo
} from '../types';
import { ContextDetector } from '../utils/context-detector';
import { KnowledgeSearch } from '../utils/knowledge-search';

type TemplateResourceKey = 'test-templates' | 'lambda-templates' | 'foxpro-test-templates';

type ParsedResourceUri = {
  type: 'category' | 'statistics' | 'index' | 'comparison' | 'detection-rules' | 'item' | 'template';
  businessLine?: BusinessLine;
  category?: KnowledgeCategory;
  itemId?: string;
  templateKey?: TemplateResourceKey;
};

/**
 * Manejador de recursos MCP para exponer el repositorio de conocimiento.
 */
export class ResourcesHandler {
  private knowledgeSearch: KnowledgeSearch;
  private contextDetector: ContextDetector;
  private knowledgeBasePath: string;

  constructor(
    knowledgeSearch: KnowledgeSearch,
    contextDetector: ContextDetector,
    knowledgeBasePath: string
  ) {
    this.knowledgeSearch = knowledgeSearch;
    this.contextDetector = contextDetector;
    this.knowledgeBasePath = knowledgeBasePath;
  }

  /**
   * Lista todos los recursos disponibles.
   */
  async listResources(): Promise<ResourceInfo[]> {
    const resources: ResourceInfo[] = [];

    for (const businessLine of BUSINESS_LINES) {
      for (const category of KNOWLEDGE_CATEGORIES) {
        resources.push({
          uri: `knowledge://${businessLine}/${category}`,
          name: `${businessLine.toUpperCase()} - ${category.replace('-', ' ')}`,
          description: `Repositorio de ${category.replace('-', ' ')} para la línea ${businessLine}`,
          mimeType: 'application/json'
        });
      }

      resources.push({
        uri: `knowledge://${businessLine}/statistics`,
        name: `${businessLine.toUpperCase()} - Statistics`,
        description: `Estadísticas del repositorio de conocimiento ${businessLine}`,
        mimeType: 'application/json'
      });

      resources.push({
        uri: `knowledge://${businessLine}/index`,
        name: `${businessLine.toUpperCase()} - Full Index`,
        description: `Índice completo del repositorio de conocimiento ${businessLine}`,
        mimeType: 'application/json'
      });

      resources.push(...await this.getTemplateResourcesForLine(businessLine));
    }

    resources.push({
      uri: 'knowledge://global/comparison',
      name: 'Knowledge Lines Comparison',
      description: 'Comparación entre shared, organic, lince y dragon2028',
      mimeType: 'application/json'
    });

    resources.push({
      uri: 'knowledge://global/detection-rules',
      name: 'Detection Rules',
      description: 'Reglas de detección automática del contexto compuesto',
      mimeType: 'application/json'
    });

    return resources;
  }

  /**
   * Obtiene el contenido de un recurso específico.
   */
  async getResource(uri: string): Promise<{ content: string; mimeType: string }> {
    const parsedUri = this.parseResourceUri(uri);

    switch (parsedUri.type) {
      case 'category':
        return this.getCategoryResource(parsedUri.businessLine!, parsedUri.category!);
      case 'statistics':
        return this.getStatisticsResource(parsedUri.businessLine!);
      case 'index':
        return this.getIndexResource(parsedUri.businessLine!);
      case 'comparison':
        return this.getComparisonResource();
      case 'detection-rules':
        return this.getDetectionRulesResource();
      case 'item':
        return this.getKnowledgeItemResource(parsedUri.businessLine!, parsedUri.itemId!);
      case 'template':
        return this.getTemplateResource(parsedUri.businessLine!, parsedUri.templateKey!);
      default:
        throw new Error(`Unknown resource type: ${uri}`);
    }
  }

  /**
   * Busca recursos por query.
   */
  async searchResources(query: string): Promise<ResourceInfo[]> {
    const allResources = await this.listResources();
    const lowerQuery = query.toLowerCase();

    return allResources.filter(resource =>
      resource.name.toLowerCase().includes(lowerQuery) ||
      resource.description?.toLowerCase().includes(lowerQuery) ||
      resource.uri.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Obtiene recursos por línea de negocio.
   */
  async getResourcesByBusinessLine(businessLine: BusinessLine): Promise<ResourceInfo[]> {
    const allResources = await this.listResources();
    return allResources.filter(resource =>
      resource.uri.includes(`knowledge://${businessLine}/`) ||
      resource.uri.includes(`templates://${businessLine}/`)
    );
  }

  /**
   * Valida si una URI de recurso existe.
   */
  async resourceExists(uri: string): Promise<boolean> {
    try {
      await this.getResource(uri);
      return true;
    } catch {
      return false;
    }
  }

  private parseResourceUri(uri: string): ParsedResourceUri {
    const templateMatch = uri.match(/^templates:\/\/([^\/]+)\/([^\/]+)$/);
    if (templateMatch) {
      const [, businessLine, templateKey] = templateMatch;
      return {
        type: 'template',
        businessLine: businessLine as BusinessLine,
        templateKey: templateKey as TemplateResourceKey
      };
    }

    const knowledgeMatch = uri.match(/^knowledge:\/\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?$/);
    if (!knowledgeMatch) {
      throw new Error(`Invalid resource URI: ${uri}`);
    }

    const [, namespace, resource, subResource] = knowledgeMatch;
    if (namespace === 'global') {
      if (resource === 'comparison') {
        return { type: 'comparison' };
      }
      if (resource === 'detection-rules') {
        return { type: 'detection-rules' };
      }
    }

    const businessLine = namespace as BusinessLine;
    if (resource === 'statistics') {
      return { type: 'statistics', businessLine };
    }
    if (resource === 'index') {
      return { type: 'index', businessLine };
    }
    if (subResource) {
      return { type: 'item', businessLine, itemId: subResource };
    }

    return {
      type: 'category',
      businessLine,
      category: resource as KnowledgeCategory
    };
  }

  private async getCategoryResource(
    businessLine: BusinessLine,
    category: KnowledgeCategory
  ): Promise<{ content: string; mimeType: string }> {
    const items = await this.knowledgeSearch.getKnowledgeByCategory(businessLine, category);

    return {
      content: JSON.stringify({
        businessLine,
        category,
        totalItems: items.length,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          tags: item.tags,
          lastUpdated: item.lastUpdated,
          version: item.version,
          uri: `knowledge://${businessLine}/${category}/${item.id}`,
          examples: item.examples?.length || 0,
          relatedItems: item.relatedItems?.length || 0
        })),
        lastUpdated: new Date().toISOString()
      }, null, 2),
      mimeType: 'application/json'
    };
  }

  private async getStatisticsResource(
    businessLine: BusinessLine
  ): Promise<{ content: string; mimeType: string }> {
    const stats = await this.knowledgeSearch.getStatistics(businessLine);

    return {
      content: JSON.stringify({
        businessLine,
        ...stats,
        generatedAt: new Date().toISOString()
      }, null, 2),
      mimeType: 'application/json'
    };
  }

  private async getIndexResource(
    businessLine: BusinessLine
  ): Promise<{ content: string; mimeType: string }> {
    const index = {
      businessLine,
      categories: {} as Record<string, unknown>,
      totalItems: 0,
      generatedAt: new Date().toISOString()
    };

    for (const category of KNOWLEDGE_CATEGORIES) {
      const items = await this.knowledgeSearch.getKnowledgeByCategory(businessLine, category);
      index.categories[category] = {
        count: items.length,
        items: items.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          tags: item.tags,
          uri: `knowledge://${businessLine}/${category}/${item.id}`
        }))
      };
      index.totalItems += items.length;
    }

    return {
      content: JSON.stringify(index, null, 2),
      mimeType: 'application/json'
    };
  }

  private async getComparisonResource(): Promise<{ content: string; mimeType: string }> {
    const entries = await Promise.all(
      BUSINESS_LINES.map(async line => {
        const stats = await this.knowledgeSearch.getStatistics(line);
        return [line, stats] as const;
      })
    );

    const statsByLine = Object.fromEntries(entries) as Record<BusinessLine, Awaited<ReturnType<KnowledgeSearch['getStatistics']>>>;

    return {
      content: JSON.stringify({
        lines: Object.fromEntries(
          BUSINESS_LINES.map(line => [
            line,
            {
              ...statsByLine[line],
              characteristics: this.getLineCharacteristics(line)
            }
          ])
        ),
        comparison: {
          commonCategories: [...KNOWLEDGE_CATEGORIES],
          compositionRule: 'shared aporta estándares FoxPro transversales y cada línea agrega conocimiento especializado',
          notableDifferences: [
            'Organic prioriza responsabilidades del monolito y herencia por producto',
            'Lince conserva foco en performance y velocidad de entrega',
            'Dragon2028 prioriza límites modulares y migración DBF a XML'
          ]
        },
        generatedAt: new Date().toISOString()
      }, null, 2),
      mimeType: 'application/json'
    };
  }

  private async getDetectionRulesResource(): Promise<{ content: string; mimeType: string }> {
    return {
      content: JSON.stringify({
        rules: this.contextDetector.getDetectionRules(),
        description: 'Reglas utilizadas para detectar línea, capa y artefacto del proyecto',
        generatedAt: new Date().toISOString()
      }, null, 2),
      mimeType: 'application/json'
    };
  }

  private async getKnowledgeItemResource(
    businessLine: BusinessLine,
    itemId: string
  ): Promise<{ content: string; mimeType: string }> {
    const item = await this.knowledgeSearch.getKnowledgeItem(businessLine, itemId);

    if (!item) {
      throw new Error(`Knowledge item not found: ${itemId}`);
    }

    const relatedItems = await this.knowledgeSearch.getRelatedItems(businessLine, itemId);

    return {
      content: JSON.stringify({
        ...item,
        relatedItemsDetails: relatedItems.map(related => ({
          id: related.id,
          title: related.title,
          description: related.description,
          category: related.category,
          uri: `knowledge://${businessLine}/${related.category}/${related.id}`
        })),
        resourceUri: `knowledge://${businessLine}/${item.category}/${item.id}`,
        accessedAt: new Date().toISOString()
      }, null, 2),
      mimeType: 'application/json'
    };
  }

  private async getTemplateResourcesForLine(businessLine: BusinessLine): Promise<ResourceInfo[]> {
    const templateKeys: TemplateResourceKey[] = [
      'test-templates',
      'lambda-templates',
      'foxpro-test-templates'
    ];

    const resources: ResourceInfo[] = [];
    for (const templateKey of templateKeys) {
      const filePath = path.join(this.knowledgeBasePath, businessLine, 'templates', `${templateKey}.md`);
      if (await fs.pathExists(filePath)) {
        resources.push({
          uri: `templates://${businessLine}/${templateKey}`,
          name: this.getTemplateName(businessLine, templateKey),
          description: this.getTemplateDescription(businessLine, templateKey),
          mimeType: 'text/markdown'
        });
      }
    }

    return resources;
  }

  private async getTemplateResource(
    businessLine: BusinessLine,
    templateKey: TemplateResourceKey
  ): Promise<{ content: string; mimeType: string }> {
    const filePath = path.join(this.knowledgeBasePath, businessLine, 'templates', `${templateKey}.md`);
    if (await fs.pathExists(filePath)) {
      return {
        content: await fs.readFile(filePath, 'utf-8'),
        mimeType: 'text/markdown'
      };
    }

    return {
      content: this.getFallbackTemplate(businessLine, templateKey),
      mimeType: 'text/markdown'
    };
  }

  private getTemplateName(businessLine: BusinessLine, templateKey: TemplateResourceKey): string {
    const titles: Record<TemplateResourceKey, string> = {
      'test-templates': 'Test Templates',
      'lambda-templates': 'Lambda Templates',
      'foxpro-test-templates': 'FoxPro Test Templates'
    };

    return `${businessLine.toUpperCase()} - ${titles[templateKey]}`;
  }

  private getTemplateDescription(businessLine: BusinessLine, templateKey: TemplateResourceKey): string {
    const descriptions: Record<TemplateResourceKey, string> = {
      'test-templates': `Plantillas generales de test para ${businessLine}`,
      'lambda-templates': `Plantillas de funciones Lambda para ${businessLine}`,
      'foxpro-test-templates': `Plantillas de test FoxPro orientadas a ${businessLine}`
    };

    return descriptions[templateKey];
  }

  private getFallbackTemplate(
    businessLine: BusinessLine,
    templateKey: TemplateResourceKey
  ): string {
    if (templateKey === 'lambda-templates') {
      return this.getDefaultLambdaTemplates(businessLine);
    }
    if (templateKey === 'foxpro-test-templates') {
      return this.getDefaultFoxProTestTemplates(businessLine);
    }

    return this.getDefaultTestTemplates(businessLine);
  }

  private getDefaultTestTemplates(businessLine: BusinessLine): string {
    return `# ${businessLine.toUpperCase()} Test Templates

## Basic Unit Test Template

\`\`\`javascript
describe('{{TEST_NAME}}', () => {
  test('should execute expected behaviour', () => {
    expect(true).toBe(true);
  });
});
\`\`\`
`;
  }

  private getDefaultLambdaTemplates(businessLine: BusinessLine): string {
    return `# ${businessLine.toUpperCase()} Lambda Templates

## Basic Lambda Template

\`\`\`javascript
exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({ businessLine: '${businessLine}' })
});
\`\`\`
`;
  }

  private getDefaultFoxProTestTemplates(businessLine: BusinessLine): string {
    return `# ${businessLine.toUpperCase()} FoxPro Test Templates

## Plantilla base

\`\`\`foxpro
Define Class {{TEST_GROUP_NAME}} as FxuTestCase OF FxuTestCase.prg
	Function Setup
	EndFunc
EndDefine
\`\`\`
`;
  }

  private getLineCharacteristics(businessLine: BusinessLine): string[] {
    switch (businessLine) {
      case 'shared':
        return [
          'Conocimiento FoxPro transversal reutilizable',
          'Estándares de codificación comunes',
          'Base para prompts y validaciones deterministas'
        ];
      case 'organic':
        return [
          'Modelo monolítico con capas Nucleo, Dibujante, Generadores y Felino',
          'Especialización por producto mediante herencia',
          'Restricción explícita sobre din_*.prg'
        ];
      case 'lince':
        return [
          'Foco en performance y velocidad',
          'Optimización agresiva de ejecución',
          'Patrones orientados a baja latencia'
        ];
      case 'dragon2028':
        return [
          'Arquitectura modular con dependencias controladas',
          'Migración gradual de DBF a XML',
          'Declaración explícita de propiedades de entidades'
        ];
      default:
        return [];
    }
  }
}