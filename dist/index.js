import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { StrapiClient } from './strapi-client.js';
import { PUBLISH_BLOG_TOOL_DEFINITION, handlePublishBlog, } from './tools/publish-blog.js';
import { CHECK_CONNECTION_TOOL_DEFINITION, CHECK_DUPLICATE_TOOL_DEFINITION, GET_CATEGORIES_TOOL_DEFINITION, handleCheckConnection, handleCheckDuplicate, handleGetCategories, } from './tools/health-tools.js';
dotenv.config();
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const MCP_SHARED_SECRET = process.env.MCP_SHARED_SECRET || 'chronicle-mcp-shared-secret-key-2026';
const PORT = parseInt(process.env.MCP_PORT || '3001', 10);
const HOST = process.env.MCP_HOST || '0.0.0.0';
const strapiClient = new StrapiClient(STRAPI_URL, MCP_SHARED_SECRET);
/**
 * Creates and configures the core MCP Server instance with tool definitions and handlers
 */
function createMcpServer() {
    const server = new Server({
        name: 'strapi-publishing-server',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    // List Tools Handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: [
                PUBLISH_BLOG_TOOL_DEFINITION,
                CHECK_CONNECTION_TOOL_DEFINITION,
                CHECK_DUPLICATE_TOOL_DEFINITION,
                GET_CATEGORIES_TOOL_DEFINITION,
            ],
        };
    });
    // Call Tool Handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        switch (name) {
            case 'publish_blog_to_strapi':
                return handlePublishBlog(strapiClient, args);
            case 'check_strapi_connection':
                return handleCheckConnection(strapiClient);
            case 'check_blog_duplicate':
                return handleCheckDuplicate(strapiClient, args);
            case 'get_blog_categories':
                return handleGetCategories(strapiClient, args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    });
    return server;
}
// -----------------------------------------------------------------------------
// Execution Mode Selection
// -----------------------------------------------------------------------------
const isStdioMode = process.argv.includes('--stdio');
if (isStdioMode) {
    // Stdio Mode for local Claude Desktop execution
    const server = createMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[MCP Stdio Server] Connected via stdio. Ready for Claude Desktop.');
}
else {
    // HTTP / SSE Remote Mode for Claude.ai Remote Connectors
    const app = express();
    app.use(cors());
    // Store active SSE sessions
    const sseTransports = new Map();
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            server: 'strapi-publishing-mcp-server',
            version: '1.0.0',
            connectedStrapiUrl: STRAPI_URL,
        });
    });
    // Modern Streamable HTTP / Direct JSON-RPC endpoint
    app.post('/mcp', express.json(), async (req, res) => {
        const { method, params, id } = req.body || {};
        if (method === 'tools/list') {
            return res.json({
                jsonrpc: '2.0',
                id,
                result: {
                    tools: [
                        PUBLISH_BLOG_TOOL_DEFINITION,
                        CHECK_CONNECTION_TOOL_DEFINITION,
                        CHECK_DUPLICATE_TOOL_DEFINITION,
                        GET_CATEGORIES_TOOL_DEFINITION,
                    ],
                },
            });
        }
        if (method === 'tools/call') {
            const toolName = params?.name;
            const toolArgs = params?.arguments;
            try {
                let result;
                if (toolName === 'publish_blog_to_strapi') {
                    result = await handlePublishBlog(strapiClient, toolArgs);
                }
                else if (toolName === 'check_strapi_connection') {
                    result = await handleCheckConnection(strapiClient);
                }
                else if (toolName === 'check_blog_duplicate') {
                    result = await handleCheckDuplicate(strapiClient, toolArgs);
                }
                else if (toolName === 'get_blog_categories') {
                    result = await handleGetCategories(strapiClient, toolArgs);
                }
                else {
                    return res.status(404).json({
                        jsonrpc: '2.0',
                        id,
                        error: { code: -32601, message: `Tool not found: ${toolName}` },
                    });
                }
                return res.json({
                    jsonrpc: '2.0',
                    id,
                    result,
                });
            }
            catch (err) {
                return res.status(500).json({
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32603, message: err.message },
                });
            }
        }
        res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32600, message: 'Invalid or unsupported JSON-RPC method.' },
        });
    });
    // SSE Transport for Claude.ai Connectors
    app.get('/sse', async (req, res) => {
        console.log('[MCP Server] New SSE connection established.');
        const transport = new SSEServerTransport('/messages', res);
        const server = createMcpServer();
        const sessionId = transport.sessionId;
        sseTransports.set(sessionId, transport);
        transport.onclose = () => {
            console.log(`[MCP Server] SSE session closed: ${sessionId}`);
            sseTransports.delete(sessionId);
        };
        await server.connect(transport);
    });
    // Message receiver for SSE sessions
    app.post('/messages', express.json(), async (req, res) => {
        const sessionId = req.query.sessionId;
        const transport = sseTransports.get(sessionId);
        if (!transport) {
            return res.status(404).json({ error: `Session not found: ${sessionId}` });
        }
        await transport.handlePostMessage(req, res);
    });
    app.listen(PORT, HOST, () => {
        console.log(`🚀 [Remote MCP Server] Running on http://${HOST}:${PORT}`);
        console.log(`📡 [Streamable HTTP Endpoint]: http://${HOST}:${PORT}/mcp`);
        console.log(`📡 [SSE Transport Endpoint]:   http://${HOST}:${PORT}/sse`);
        console.log(`🔗 [Target Strapi Backend]:    ${STRAPI_URL}`);
    });
}
