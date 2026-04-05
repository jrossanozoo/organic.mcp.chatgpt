/**
 * Tipos principales para el servidor MCP Organic/Lince
 */

export const BUSINESS_LINES = ['shared', 'organic', 'lince', 'dragon2028'] as const;

export type BusinessLine = typeof BUSINESS_LINES[number];

export const KNOWLEDGE_CATEGORIES = [
  'architecture',
  'patterns',
  'standards',
  'best-practices'
] as const;

export type KnowledgeCategory = typeof KNOWLEDGE_CATEGORIES[number];

export const CONTEXT_LAYERS = [
  'shared',
  'core',
  'business',
  'ui',
  'generators',
  'module',
  'data',
  'testing',
  'unknown'
] as const;

export type ContextLayer = typeof CONTEXT_LAYERS[number];

export const ARTIFACT_TYPES = [
  'foxpro-source',
  'generated-foxpro',
  'dbf-definition',
  'xml-definition',
  'template',
  'test',
  'markdown',
  'typescript-source',
  'unknown'
] as const;

export type ArtifactType = typeof ARTIFACT_TYPES[number];

export interface ProjectContext {
  businessLine: BusinessLine;
  line: BusinessLine;
  projectPath: string;
  projectType?: string;
  layer?: ContextLayer;
  product?: string;
  artifactType?: ArtifactType;
  technologies: string[];
  confidence: number;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: KnowledgeCategory;
  businessLine: BusinessLine;
  tags: string[];
  content: string;
  examples?: CodeExample[];
  relatedItems?: string[];
  lastUpdated: Date;
  version: string;
}

export interface CodeExample {
  language: string;
  title: string;
  code: string;
  description?: string;
}

export interface ContextPrompt {
  businessLine: BusinessLine;
  prompt: string;
  variables?: Record<string, string>;
  includedKnowledge: string[];
  appliedLines?: BusinessLine[];
}

export interface SearchResult {
  items: KnowledgeItem[];
  totalCount: number;
  searchTerms: string[];
  businessLine: BusinessLine;
  appliedLines?: BusinessLine[];
}

export interface TestGenerationRequest {
  testName: string;
  testFileName: string;
  businessLine: BusinessLine;
  technology: string;
  testType: 'unit' | 'integration' | 'e2e';
  framework?: string;
  targetFile?: string;
}

export interface LambdaGenerationRequest {
  functionName: string;
  parameters: LambdaParameter[];
  formula: string;
  businessLine: BusinessLine;
  runtime: 'nodejs' | 'python' | 'java' | 'csharp';
  returnType?: string;
  description?: string;
}

export interface LambdaParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: any;
}

export interface GeneratedContent {
  fileName: string;
  content: string;
  language: string;
  dependencies?: string[];
  instructions?: string[];
}

export interface FoxProTestGroupRequest {
  testGroupName: string;
  testDirectory: string;
  businessLine: BusinessLine;
  description?: string;
}

export interface FoxProTestMethodRequest {
  testFileName: string;
  methodName: string;
  testDirectory: string;
  businessLine: BusinessLine;
  description?: string;
}

export interface DetectionRule {
  name: string;
  businessLine: BusinessLine;
  patterns: {
    files?: string[];
    directories?: string[];
    content?: string[];
    packageNames?: string[];
  };
  weight: number;
}

export type ServerTransportMode = 'stdio' | 'http';

export interface MCPConfig {
  server: {
    name: string;
    version: string;
    transport: ServerTransportMode;
    host: string;
    port: number;
    path: string;
  };
  knowledge: {
    basePath: string;
    indexingEnabled: boolean;
    cacheTimeout: number;
  };
  detection: {
    rules: DetectionRule[];
    defaultBusinessLine: BusinessLine;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
}

export interface ToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface ResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface PromptInfo {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}
