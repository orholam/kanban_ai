import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateSupabaseAccessToken } from '../_lib/mcp/auth';
import { vercelRequestToWebRequest } from '../_lib/mcp/vercelBridge';

function extractBearerToken(req: VercelRequest): string | undefined {
  const auth = req.headers.authorization?.trim();
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

function getMcpEndpointFromRequest(req: VercelRequest): string {
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}/api/mcp`;
  }
  return 'https://kanbanai.dev/api/mcp';
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const request = vercelRequestToWebRequest(req);
  const auth = await authenticateSupabaseAccessToken(request);
  if (!auth.ok) {
    res.status(401).json({ error: 'Unauthorized', reason: auth.reason });
    return;
  }

  const accessToken = extractBearerToken(req);
  if (!accessToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const endpoint = getMcpEndpointFromRequest(req);
  const mcpApiSecret = process.env.MCP_API_SECRET?.trim();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (mcpApiSecret) {
    headers['X-MCP-API-Key'] = mcpApiSecret;
  }

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'kanban-ai': {
          url: endpoint,
          headers,
        },
      },
    },
    null,
    2
  );

  const claudeArgs = ['-y', 'mcp-remote', endpoint];
  if (mcpApiSecret) {
    claudeArgs.push('--header', `X-MCP-API-Key:${mcpApiSecret}`);
  }
  claudeArgs.push('--header', `Authorization:Bearer ${accessToken}`);

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        'kanban-ai': {
          command: 'npx',
          args: claudeArgs,
        },
      },
    },
    null,
    2
  );

  res.status(200);
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    endpoint,
    cursorConfig,
    claudeConfig,
  });
}
