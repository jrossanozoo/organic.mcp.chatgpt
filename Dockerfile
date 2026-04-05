FROM node:18-alpine AS builder

WORKDIR /app

# Copy package manifest and install dependencies for build
COPY package.json ./
RUN npm install

# Copy source and build inside the image
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy runtime artifacts
COPY --from=builder /app/dist/ ./dist/
COPY src/knowledge/ ./src/knowledge/
COPY mcp-config.json ./mcp-config.json

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV KNOWLEDGE_BASE_PATH=./src/knowledge
ENV DEFAULT_BUSINESS_LINE=organic
ENV LOG_LEVEL=info
ENV MCP_TRANSPORT=http
ENV MCP_SERVER_HOST=0.0.0.0
ENV MCP_SERVER_PORT=3000
ENV MCP_HTTP_PATH=/mcp

# Expose default HTTP port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('node:http');const port=Number(process.env.MCP_SERVER_PORT||3000);const request=http.get({host:'127.0.0.1',port,path:'/health'},(response)=>{process.exit(response.statusCode===200?0:1);});request.on('error',()=>process.exit(1));"

# Run the application
CMD ["node", "dist/server.js"]
