import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs-extra';
import type { IncomingMessage, Server as NodeHttpServer, ServerResponse } from 'node:http';
import * as http from 'node:http';
import * as path from 'path';

import { ContextDetector } from './utils/context-detector';
import { KnowledgeSearch } from './utils/knowledge-search';
import { ToolsHandler } from './handlers/tools';
import { ResourcesHandler } from './handlers/resources';
import { PromptsHandler, SpecificPromptType } from './handlers/prompts';
import { BUSINESS_LINES, BusinessLine, MCPConfig, ServerTransportMode } from './types';

const DEFAULT_CONFIG_FILE = 'mcp-config.json';

/**
 * Servidor MCP para el repositorio de conocimiento corporativo Organic/Lince
 */
class OrganicMCPServer {
  private stdioServer?: Server;
  private httpServer?: NodeHttpServer;
  private sseSessions = new Map<string, { transport: SSEServerTransport; server: Server }>();
  private contextDetector!: ContextDetector;
  private knowledgeSearch!: KnowledgeSearch;
  private toolsHandler!: ToolsHandler;
  private resourcesHandler!: ResourcesHandler;
  private promptsHandler!: PromptsHandler;
  private config: MCPConfig;

  constructor() {
    this.config = this.loadConfig();
    this.rebuildComponents(this.config.knowledge.basePath);
    this.registerShutdownHandlers();
  }

  /**
   * Reconstruye los componentes dependientes del repositorio de conocimiento.
   */
  private rebuildComponents(knowledgeBasePath: string): void {
    this.contextDetector = new ContextDetector(knowledgeBasePath);
    this.knowledgeSearch = new KnowledgeSearch(knowledgeBasePath);
    this.promptsHandler = new PromptsHandler(this.knowledgeSearch);
    this.toolsHandler = new ToolsHandler(
      this.contextDetector,
      this.knowledgeSearch,
      this.promptsHandler
    );
    this.resourcesHandler = new ResourcesHandler(
      this.knowledgeSearch,
      this.contextDetector,
      knowledgeBasePath
    );
  }

  /**
   * Crea una instancia de servidor MCP y registra sus handlers.
   */
  private createProtocolServer(): Server {
    const server = new Server(
      {
        name: this.config.server.name,
        version: this.config.server.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers(server);
    return server;
  }

  /**
   * Configura los manejadores del servidor MCP.
   */
  private setupHandlers(server: Server): void {
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = this.toolsHandler.getAvailableTools();
      return { tools };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const toolRequest = {
          name: request.params.name,
          arguments: request.params.arguments || {}
        };
        
        const result = await this.toolsHandler.executeTool(toolRequest);
        return {
          content: result.content
        };
      } catch (error) {
        return {
          content: [{
            type: 'text' as const,
            text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    });

    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const resources = await this.resourcesHandler.listResources();
      return { resources };
    });

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      const resource = await this.resourcesHandler.getResource(uri);
      
      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text: resource.content,
          },
        ],
      };
    });

    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const prompts = this.promptsHandler.getAvailablePrompts();
      return { prompts };
    });

    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      let businessLine: BusinessLine = this.config.detection.defaultBusinessLine;
      let projectContext;
      if (args?.projectPath) {
        projectContext = await this.contextDetector.detectContext(args.projectPath);
      }
      if (args?.businessLine) {
        businessLine = args.businessLine as BusinessLine;
      } else if (projectContext) {
        businessLine = projectContext.businessLine;
      }

      let prompt: string;
      const includeKnowledge = args?.includeKnowledge !== 'false';
      const promptTypesByName: Record<string, SpecificPromptType> = {
        'architecture-prompt': 'architecture',
        'debugging-prompt': 'debugging',
        'testing-prompt': 'testing',
        'security-prompt': 'security',
        'performance-prompt': 'performance',
        'test-generation-prompt': 'test-generation',
        'lambda-generation-prompt': 'lambda-generation',
        'foxpro-refactor-prompt': 'foxpro-refactor',
        'foxpro-note-prompt': 'foxpro-note',
        'entity-location-prompt': 'entity-location',
        'dragon-architecture-prompt': 'dragon-architecture',
        'dbf-to-xml-migration-prompt': 'dbf-to-xml-migration'
      };
      
      switch (name) {
        case 'context-prompt':
          const contextPrompt = await this.promptsHandler.getContextPrompt(
            businessLine,
            projectContext,
            includeKnowledge
          );
          prompt = contextPrompt.prompt;
          break;

        default:
          if (!promptTypesByName[name]) {
            throw new Error(`Unknown prompt: ${name}`);
          }

          prompt = await this.promptsHandler.getSpecificPrompt(
            businessLine,
            promptTypesByName[name],
            args?.context
          );
          break;
      }

      return {
        description: `Prompt contextual para ${businessLine}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: prompt,
            },
          },
        ],
      };
    });

    server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }

  /**
   * Registra el cierre ordenado del proceso.
   */
  private registerShutdownHandlers(): void {
    const shutdown = (exitCode: number) => {
      void this.stop()
        .catch((error) => {
          console.error('Error stopping MCP server:', error);
        })
        .finally(() => {
          process.exit(exitCode);
        });
    };

    process.on('SIGINT', () => shutdown(0));
    process.on('SIGTERM', () => shutdown(0));
  }

  /**
   * Carga configuración desde archivo y variables de entorno.
   */
  private loadConfig(): MCPConfig {
    const fileConfig = this.loadFileConfig();
    const defaultConfig: MCPConfig = {
      server: {
        name: 'zoocode-mcp-organic',
        version: '1.0.0',
        transport: 'stdio',
        host: '127.0.0.1',
        port: 3000,
        path: '/mcp'
      },
      knowledge: {
        basePath: './src/knowledge',
        indexingEnabled: true,
        cacheTimeout: 300000
      },
      detection: {
        rules: [],
        defaultBusinessLine: 'organic'
      },
      logging: {
        level: 'info'
      }
    };

    const fileServer = fileConfig.server || defaultConfig.server;
    const fileKnowledge = fileConfig.knowledge || defaultConfig.knowledge;
    const fileDetection = fileConfig.detection || defaultConfig.detection;
    const fileLogging = fileConfig.logging || defaultConfig.logging;

    return {
      server: {
        name: fileServer.name || defaultConfig.server.name,
        version: fileServer.version || defaultConfig.server.version,
        transport: this.resolveTransportMode(process.env.MCP_TRANSPORT)
          || this.resolveTransportMode(fileServer.transport)
          || defaultConfig.server.transport,
        host: process.env.MCP_SERVER_HOST || fileServer.host || defaultConfig.server.host,
        port: this.parsePositiveInteger(
          process.env.MCP_SERVER_PORT || process.env.PORT,
          this.parsePositiveInteger(fileServer.port, defaultConfig.server.port)
        ),
        path: this.normalizeHttpPath(process.env.MCP_HTTP_PATH || fileServer.path || defaultConfig.server.path)
      },
      knowledge: {
        basePath: process.env.KNOWLEDGE_BASE_PATH || fileKnowledge.basePath || defaultConfig.knowledge.basePath,
        indexingEnabled: fileKnowledge.indexingEnabled ?? defaultConfig.knowledge.indexingEnabled,
        cacheTimeout: this.parsePositiveInteger(
          process.env.CACHE_TIMEOUT,
          this.parsePositiveInteger(fileKnowledge.cacheTimeout, defaultConfig.knowledge.cacheTimeout)
        )
      },
      detection: {
        rules: fileDetection.rules || defaultConfig.detection.rules,
        defaultBusinessLine: this.resolveBusinessLine(process.env.DEFAULT_BUSINESS_LINE)
          || this.resolveBusinessLine(fileDetection.defaultBusinessLine)
          || defaultConfig.detection.defaultBusinessLine
      },
      logging: {
        level: this.resolveLogLevel(process.env.LOG_LEVEL)
          || this.resolveLogLevel(fileLogging.level)
          || defaultConfig.logging.level,
        file: process.env.LOG_FILE || fileLogging.file
      }
    };
  }

  /**
   * Lee el archivo mcp-config.json si está disponible.
   */
  private loadFileConfig(): Partial<MCPConfig> {
    const configPath = process.env.MCP_CONFIG_PATH
      ? path.resolve(process.env.MCP_CONFIG_PATH)
      : path.join(process.cwd(), DEFAULT_CONFIG_FILE);

    if (!fs.pathExistsSync(configPath)) {
      return {};
    }

    try {
      return fs.readJsonSync(configPath) as Partial<MCPConfig>;
    } catch (error) {
      console.error(`No se pudo leer ${configPath}:`, error);
      return {};
    }
  }

  private resolveTransportMode(value: string | undefined): ServerTransportMode | undefined {
    return value === 'http' || value === 'stdio' ? value : undefined;
  }

  private resolveBusinessLine(value: string | undefined): BusinessLine | undefined {
    if (value && BUSINESS_LINES.includes(value as BusinessLine)) {
      return value as BusinessLine;
    }

    return undefined;
  }

  private resolveLogLevel(value: string | undefined): MCPConfig['logging']['level'] | undefined {
    return value === 'debug' || value === 'info' || value === 'warn' || value === 'error'
      ? value
      : undefined;
  }

  private parsePositiveInteger(value: number | string | undefined, fallback: number): number {
    const parsedValue = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
  }

  private normalizeHttpPath(value: string): string {
    const normalizedValue = value.startsWith('/') ? value : `/${value}`;
    return normalizedValue === '/' ? normalizedValue : normalizedValue.replace(/\/+$/, '');
  }

  /**
   * Inicia el servidor MCP.
   */
  async start(): Promise<void> {
    if (this.config.server.transport === 'http') {
      await this.startHttpServer();
      return;
    }

    this.stdioServer = this.createProtocolServer();
    const transport = new StdioServerTransport();
    await this.stdioServer.connect(transport);

    console.error(`Servidor MCP Organic iniciado - ${this.config.server.name} v${this.config.server.version}`);
    console.error(`Transporte: stdio`);
    console.error(`Base de conocimiento: ${this.config.knowledge.basePath}`);
    console.error(`Línea de negocio por defecto: ${this.config.detection.defaultBusinessLine}`);
  }

  /**
   * Inicia el servidor HTTP para exponer el endpoint MCP.
   */
  private async startHttpServer(): Promise<void> {
    const { host, path: endpointPath, port } = this.config.server;

    this.httpServer = http.createServer((req, res) => {
      void this.routeHttpRequest(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      const server = this.httpServer!;
      server.once('error', reject);
      server.listen(port, host, () => {
        server.off('error', reject);
        resolve();
      });
    });

    const publicHost = host === '0.0.0.0' ? 'localhost' : host;

    console.error(`Servidor MCP Organic iniciado - ${this.config.server.name} v${this.config.server.version}`);
    console.error(`Transporte: http`);
    console.error(`Base de conocimiento: ${this.config.knowledge.basePath}`);
    console.error(`Línea de negocio por defecto: ${this.config.detection.defaultBusinessLine}`);
    console.error(`Endpoint MCP: http://${publicHost}:${port}${endpointPath}`);
    console.error(`Health check: http://${publicHost}:${port}/health`);
  }

  /**
   * Enruta solicitudes HTTP entrantes.
   */
  private async routeHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const requestUrl = new URL(
        req.url || '/',
        `http://${req.headers.host || `${this.config.server.host}:${this.config.server.port}`}`
      );

      if (req.method === 'GET' && requestUrl.pathname === '/health') {
        this.respondJson(res, 200, {
          status: 'ok',
          name: this.config.server.name,
          transport: this.config.server.transport,
          endpoint: this.config.server.path,
          port: this.config.server.port
        });
        return;
      }

      if (req.method === 'GET' && requestUrl.pathname === '/') {
        this.respondJson(res, 200, {
          name: this.config.server.name,
          version: this.config.server.version,
          transport: this.config.server.transport,
          endpoint: this.config.server.path,
            legacySseEndpoint: '/sse',
            legacyMessageEndpoint: '/messages',
            health: '/health'
        });
        return;
      }

        if (req.method === 'GET' && requestUrl.pathname === '/sse') {
          await this.handleLegacySseConnection(res);
          return;
        }

        if (req.method === 'POST' && requestUrl.pathname === '/messages') {
          await this.handleLegacySseMessage(req, res, requestUrl);
          return;
        }

      if (requestUrl.pathname !== this.config.server.path) {
        this.respondJson(res, 404, {
          error: 'Not found',
          expectedPath: this.config.server.path
        });
        return;
      }

      if (req.method === 'POST') {
        await this.handleHttpMcpRequest(req, res);
        return;
      }

      this.respondJson(res, 405, {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.'
        },
        id: null
      });
    } catch (error) {
      console.error('Error handling HTTP request:', error);

      if (!res.headersSent) {
        this.respondJson(res, 500, {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  }

  /**
   * Atiende una solicitud MCP por HTTP stateless.
   */
  private async handleHttpMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const parsedBody = await this.readJsonBody(req);
    const requestServer = this.createProtocolServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    let closed = false;
    const closeResources = () => {
      if (closed) {
        return;
      }

      closed = true;
      void transport.close();
      void requestServer.close();
    };

    res.on('close', closeResources);

    try {
      await requestServer.connect(transport);
      await transport.handleRequest(req, res, parsedBody);
    } catch (error) {
      console.error('Error handling MCP HTTP request:', error);

      if (!res.headersSent) {
        this.respondJson(res, 500, {
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }

      closeResources();
    }
  }

  /**
   * Atiende la conexión SSE legada usada por clientes MCP antiguos.
   */
  private async handleLegacySseConnection(res: ServerResponse): Promise<void> {
    const sseServer = this.createProtocolServer();
    const transport = new SSEServerTransport('/messages', res);

    this.sseSessions.set(transport.sessionId, {
      transport,
      server: sseServer
    });

    const cleanup = () => {
      const session = this.sseSessions.get(transport.sessionId);
      if (!session) {
        return;
      }

      this.sseSessions.delete(transport.sessionId);
      void session.server.close();
      void session.transport.close();
    };

    res.on('close', cleanup);
    transport.onclose = cleanup;

    await sseServer.connect(transport);
  }

  /**
   * Atiende mensajes POST del transporte SSE legado.
   */
  private async handleLegacySseMessage(
    req: IncomingMessage,
    res: ServerResponse,
    requestUrl: URL
  ): Promise<void> {
    const sessionId = requestUrl.searchParams.get('sessionId');

    if (!sessionId) {
      this.respondJson(res, 400, {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Missing sessionId'
        },
        id: null
      });
      return;
    }

    const session = this.sseSessions.get(sessionId);
    if (!session) {
      this.respondJson(res, 400, {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No transport found for sessionId'
        },
        id: null
      });
      return;
    }

    const parsedBody = await this.readJsonBody(req);
    await session.transport.handlePostMessage(req, res, parsedBody);
  }

  /**
   * Lee y parsea el body JSON de una solicitud HTTP.
   */
  private async readJsonBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
      return undefined;
    }

    const rawBody = Buffer.concat(chunks).toString('utf-8').trim();
    return rawBody ? JSON.parse(rawBody) : undefined;
  }

  /**
   * Escribe una respuesta JSON simple.
   */
  private respondJson(res: ServerResponse, statusCode: number, payload: unknown): void {
    if (res.writableEnded) {
      return;
    }

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  /**
   * Detiene el servidor MCP.
   */
  async stop(): Promise<void> {
    for (const [sessionId, session] of this.sseSessions.entries()) {
      await session.transport.close().catch(() => undefined);
      await session.server.close().catch(() => undefined);
      this.sseSessions.delete(sessionId);
    }

    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
      this.httpServer = undefined;
    }

    if (this.stdioServer) {
      await this.stdioServer.close();
      this.stdioServer = undefined;
    }
  }

  /**
   * Actualiza la configuración del servidor.
   */
  updateConfig(newConfig: Partial<MCPConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      server: {
        ...this.config.server,
        ...newConfig.server,
        transport: this.resolveTransportMode(newConfig.server?.transport)
          || this.config.server.transport,
        path: this.normalizeHttpPath(newConfig.server?.path || this.config.server.path)
      },
      knowledge: {
        ...this.config.knowledge,
        ...newConfig.knowledge
      },
      detection: {
        ...this.config.detection,
        ...newConfig.detection,
        defaultBusinessLine: this.resolveBusinessLine(newConfig.detection?.defaultBusinessLine)
          || this.config.detection.defaultBusinessLine
      },
      logging: {
        ...this.config.logging,
        ...newConfig.logging,
        level: this.resolveLogLevel(newConfig.logging?.level)
          || this.config.logging.level
      }
    };
    
    if (newConfig.knowledge?.basePath) {
      this.rebuildComponents(newConfig.knowledge.basePath);
    }
  }

  /**
   * Obtiene información del estado del servidor
   */
  getServerInfo(): {
    config: MCPConfig;
    uptime: number;
    businessLines: BusinessLine[];
    stats: {
      tools: number;
      resources: number;
      prompts: number;
    };
  } {
    return {
      config: this.config,
      uptime: process.uptime(),
      businessLines: [...BUSINESS_LINES],
      stats: {
        tools: this.toolsHandler.getAvailableTools().length,
        resources: 0, // Se calculará dinámicamente
        prompts: this.promptsHandler.getAvailablePrompts().length
      }
    };
  }

  /**
   * Invalida el cache del repositorio de conocimiento
   */
  invalidateKnowledgeCache(businessLine?: BusinessLine): void {
    this.knowledgeSearch.invalidateCache(businessLine);
  }

  /**
   * Agrega una regla personalizada de detección
   */
  addDetectionRule(rule: any): void {
    this.contextDetector.addDetectionRule(rule);
  }
}

// Función principal para ejecutar el servidor
async function main(): Promise<void> {
  const server = new OrganicMCPServer();
  
  try {
    await server.start();
  } catch (error) {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { OrganicMCPServer };
