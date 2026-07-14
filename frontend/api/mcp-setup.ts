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

function extractBearerToken(req: VercelRequest): string | undefined {
  const auth = req.headers.authorization?.trim();
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

function jwtExpiresAt(accessToken: string): number | null {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'unknown';
}

function isMissingMcpKeysTable(error: unknown): boolean {
  const msg = errorMessage(error);
  return msg.includes('mcp_api_keys') || msg.includes('PGRST205');
}

function buildConfigs(input: {
  endpoint: string;
  bearerToken: string;
  mcpApiSecret?: string;
}): { cursorConfig: string; claudeConfig: string } {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.bearerToken}`,
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
  claudeArgs.push('--header', `Authorization:Bearer ${input.bearerToken}`);

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

function respondSessionJwt(
  res: VercelResponse,
  input: {
    endpoint: string;
    accessToken: string;
    mcpApiSecret?: string;
    setupNotice?: string;
  }
): void {
  const { cursorConfig, claudeConfig } = buildConfigs({
    endpoint: input.endpoint,
    bearerToken: input.accessToken,
    mcpApiSecret: input.mcpApiSecret,
  });
  res.status(200);
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    endpoint: input.endpoint,
    cursorConfig,
    claudeConfig,
    keyPrefix: null,
    rotated: false,
    expiresAt: jwtExpiresAt(input.accessToken),
    authMode: 'session_jwt',
    setupNotice: input.setupNotice,
  });
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

    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      res.status(401).json({ error: 'Unauthorized', reason: 'missing_access_token' });
      return;
    }

    const endpoint = getMcpEndpointFromRequest(req);
    const mcpApiSecret = process.env.MCP_API_SECRET?.trim();
    const rotate =
      req.query.rotate === '1' ||
      req.query.rotate === 'true' ||
      String(req.query.rotate ?? '').toLowerCase() === 'yes';

    const service = createServiceRoleClient();
    if (service) {
      try {
        const { plainKey, keyPrefix, rotated } = await resolvePlainMcpApiKey(service, auth.context.userId, {
          rotate,
        });
        const { cursorConfig, claudeConfig } = buildConfigs({
          endpoint,
          bearerToken: plainKey,
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
          authMode: 'personal_key',
        });
        return;
      } catch (error) {
        console.error('mcp-setup key resolve error; falling back to session JWT', error);
        const notice = isMissingMcpKeysTable(error)
          ? 'Long-lived MCP keys are not enabled on this database yet — using your session token (~1 hour). Run the mcp_api_keys migration on the Kanban Supabase project.'
          : `Personal MCP keys unavailable (${errorMessage(error)}). Using your session token (~1 hour).`;
        respondSessionJwt(res, {
          endpoint,
          accessToken,
          mcpApiSecret,
          setupNotice: notice,
        });
        return;
      }
    }

    console.warn('mcp-setup: SUPABASE_SERVICE_ROLE_KEY missing; using session JWT');
    respondSessionJwt(res, {
      endpoint,
      accessToken,
      mcpApiSecret,
      setupNotice: 'Using your session token (~1 hour). Set SUPABASE_SERVICE_ROLE_KEY on Vercel for long-lived keys.',
    });
  } catch (error) {
    console.error('mcp-setup error', error);
    res.status(500).json({ error: 'Failed to build MCP setup config', reason: errorMessage(error) });
  }
}
