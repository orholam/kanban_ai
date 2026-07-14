import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateSupabaseAccessToken } from './_lib/mcp/auth.js';
import { resolvePlainMcpApiKey } from './_lib/mcp/apiKeys.js';
import { createServiceRoleClient } from './_lib/supabaseService.js';
import { vercelRequestToWebRequest } from './_lib/mcp/vercelBridge.js';

function getMcpEndpointFromRequest(req: VercelRequest): string {
  const host = (req.headers['x-forwarded-host'] as string | undefined) || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) || 'https';
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}/api/mcp`;
  }
  return 'https://kanbanai.dev/api/mcp';
}

function buildConfigs(input: {
  endpoint: string;
  personalKey: string;
  mcpApiSecret?: string;
}): { cursorConfig: string; claudeConfig: string } {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.personalKey}`,
  };
  if (input.mcpApiSecret) {
    headers['X-MCP-API-Key'] = input.mcpApiSecret;
  }

  const cursorConfig = JSON.stringify(
    {
      mcpServers: {
        'kanban-ai': {
          url: input.endpoint,
          headers,
        },
      },
    },
    null,
    2
  );

  const claudeArgs = ['-y', 'mcp-remote', input.endpoint];
  if (input.mcpApiSecret) {
    claudeArgs.push('--header', `X-MCP-API-Key:${input.mcpApiSecret}`);
  }
  claudeArgs.push('--header', `Authorization:Bearer ${input.personalKey}`);

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

  return { cursorConfig, claudeConfig };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
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

    const service = createServiceRoleClient();
    if (!service) {
      res.status(503).json({
        error: 'MCP key setup unavailable',
        reason: 'service_role_not_configured',
      });
      return;
    }

    const rotate =
      req.query.rotate === '1' ||
      req.query.rotate === 'true' ||
      String(req.query.rotate ?? '').toLowerCase() === 'yes';

    let plainKey: string;
    let keyPrefix: string;
    let rotated: boolean;
    try {
      ({ plainKey, keyPrefix, rotated } = await resolvePlainMcpApiKey(service, auth.context.userId, {
        rotate,
      }));
    } catch (error) {
      console.error('mcp-setup key resolve error', error);
      res.status(500).json({
        error: 'Failed to issue MCP API key',
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return;
    }

    const endpoint = getMcpEndpointFromRequest(req);
    const mcpApiSecret = process.env.MCP_API_SECRET?.trim();
    const { cursorConfig, claudeConfig } = buildConfigs({
      endpoint,
      personalKey: plainKey,
      mcpApiSecret,
    });

    res.status(200);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      endpoint,
      cursorConfig,
      claudeConfig,
      keyPrefix,
      rotated,
      expiresAt: null,
    });
  } catch (error) {
    console.error('mcp-setup error', error);
    res.status(500).json({ error: 'Failed to build MCP setup config' });
  }
}
