import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMcpHandler } from 'mcp-handler';
import { recordMcpAuthFailure, recordMcpSession } from './_lib/mcp/analytics.js';
import { authenticateMcpRequest } from './_lib/mcp/auth.js';
import { mcpRequestContext } from './_lib/mcp/requestContext.js';
import { registerKanbanMcpTools } from './_lib/mcp/registerTools.js';
import { sendWebResponse, vercelRequestToWebRequest } from './_lib/mcp/vercelBridge.js';
import {
  applyHeaders,
  clientIp,
  MCP_CORS_HEADERS,
  mcpWwwAuthenticate,
} from './_lib/mcp/httpHeaders.js';
import { consumeMcpRateLimit, mcpRateLimitKey, rateLimitHeaders } from './_lib/mcp/rateLimit.js';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './_lib/mcp/version.js';

const mcpHandler = createMcpHandler(
  (server) => {
    registerKanbanMcpTools(server);
  },
  {
    serverInfo: {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
  },
  {
    basePath: '/api',
    disableSse: true,
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== 'production',
  }
);

function sendJson(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string>
): void {
  applyHeaders(res, { ...MCP_CORS_HEADERS, ...extraHeaders, 'Cache-Control': 'no-store' });
  res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    applyHeaders(res, MCP_CORS_HEADERS);
    res.status(204).end();
    return;
  }

  const request = vercelRequestToWebRequest(req);
  const auth = await authenticateMcpRequest(request);

  const limitKey = mcpRateLimitKey({
    userId: auth.ok ? auth.context.userId : undefined,
    tokenFingerprint: auth.ok === false ? auth.tokenFingerprint : undefined,
    ip: clientIp(req),
  });
  const limit = consumeMcpRateLimit(limitKey, auth.ok);
  const limitHeaders = rateLimitHeaders(limit);

  if (!limit.allowed) {
    sendJson(
      res,
      429,
      {
        error: 'Rate limited',
        hint: 'Too many MCP requests in a short window. Wait for Retry-After seconds and retry.',
      },
      limitHeaders
    );
    return;
  }

  if (auth.ok === false) {
    recordMcpAuthFailure({
      reason: auth.reason,
      attemptedUserId: auth.attemptedUserId,
      attemptedEmail: auth.attemptedEmail,
      tokenFingerprint: auth.tokenFingerprint,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
    });
    sendJson(
      res,
      401,
      {
        error: 'Unauthorized',
        hint: 'Send Authorization: Bearer <kai_… personal key from /connect> (or a session JWT). If MCP_API_SECRET is set, also send X-MCP-API-Key.',
      },
      {
        ...limitHeaders,
        'WWW-Authenticate': mcpWwwAuthenticate(req),
      }
    );
    return;
  }

  recordMcpSession({ userId: auth.context.userId, method: req.method ?? 'POST' });

  await mcpRequestContext.run(auth.context, async () => {
    const response = await mcpHandler(request);
    applyHeaders(res, { ...MCP_CORS_HEADERS, ...limitHeaders });
    await sendWebResponse(res, response);
  });
}
