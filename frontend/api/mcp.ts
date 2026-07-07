import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMcpHandler } from 'mcp-handler';
import { recordMcpAuthFailure, recordMcpSession } from './_lib/mcp/analytics';
import { authenticateMcpRequest } from './_lib/mcp/auth';
import { mcpRequestContext } from './_lib/mcp/requestContext';
import { registerKanbanMcpTools } from './_lib/mcp/registerTools';
import { sendWebResponse, vercelRequestToWebRequest } from './_lib/mcp/vercelBridge';

const mcpHandler = createMcpHandler(
  (server) => {
    registerKanbanMcpTools(server);
  },
  {
    serverInfo: {
      name: 'kanban-ai',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api',
    disableSse: true,
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== 'production',
  }
);

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-MCP-API-Key, X-Supabase-Access-Token, Mcp-Session-Id');
    res.end();
    return;
  }

  const request = vercelRequestToWebRequest(req);
  const auth = await authenticateMcpRequest(request);
  if (!auth.ok) {
    recordMcpAuthFailure({ reason: auth.reason });
    res.status(401).json({
      error: 'Unauthorized',
      hint: 'Send Authorization: Bearer <supabase_access_token> and, if configured, X-MCP-API-Key.',
    });
    return;
  }

  recordMcpSession({ userId: auth.context.userId, method: req.method ?? 'POST' });

  await mcpRequestContext.run(auth.context, async () => {
    const response = await mcpHandler(request);
    await sendWebResponse(res, response);
  });
}
