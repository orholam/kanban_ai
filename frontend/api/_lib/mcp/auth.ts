import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  findActiveKeyByHash,
  hashMcpApiKey,
  isMcpPersonalApiKey,
  touchKeyLastUsed,
} from './apiKeys.js';
import { createServiceRoleClient } from '../supabaseService.js';

export type McpAuthContext = {
  supabase: SupabaseClient;
  userId: string;
  userEmail?: string;
  /** session = short-lived Supabase JWT; api_key = long-lived kai_ token */
  authMethod: 'session' | 'api_key';
};

export type McpAuthFailure = {
  ok: false;
  reason: string;
  /** Parsed from JWT `sub` when a bearer token was sent (even if invalid/expired). */
  attemptedUserId?: string;
  attemptedEmail?: string;
  /** Stable hash so repeated failures from the same token group together. */
  tokenFingerprint?: string;
};

export type McpAuthResult = { ok: true; context: McpAuthContext } | McpAuthFailure;

function readSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured (SUPABASE_URL / SUPABASE_ANON_KEY).');
  }
  return { url, anonKey };
}

function extractBearerToken(request: Request): string | undefined {
  const auth = request.headers.get('authorization')?.trim();
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const alt = request.headers.get('x-supabase-access-token')?.trim();
  return alt || undefined;
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractTokenHints(accessToken: string): Pick<McpAuthFailure, 'attemptedUserId' | 'attemptedEmail' | 'tokenFingerprint'> {
  const tokenFingerprint = createHash('sha256').update(accessToken).digest('hex').slice(0, 16);
  const payload = decodeJwtPayload(accessToken);
  const sub = typeof payload?.sub === 'string' ? payload.sub : undefined;
  const email = typeof payload?.email === 'string' ? payload.email : undefined;
  return {
    ...(sub ? { attemptedUserId: sub } : {}),
    ...(email ? { attemptedEmail: email } : {}),
    tokenFingerprint,
  };
}

function authFailure(reason: string, accessToken?: string): McpAuthFailure {
  return {
    ok: false,
    reason,
    ...(accessToken ? extractTokenHints(accessToken) : {}),
  };
}

function createUserScopedClient(accessToken: string): SupabaseClient {
  const { url, anonKey } = readSupabaseConfig();
  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Validates only the Supabase session — used for in-app setup config, not MCP tool calls. */
export async function authenticateSupabaseAccessToken(request: Request): Promise<McpAuthResult> {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return authFailure('missing_access_token');
  }
  if (isMcpPersonalApiKey(accessToken)) {
    return authFailure('session_required', accessToken);
  }

  let supabase: SupabaseClient;
  try {
    supabase = createUserScopedClient(accessToken);
  } catch {
    return authFailure('supabase_not_configured', accessToken);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return authFailure('invalid_access_token', accessToken);
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      userEmail: user.email,
      authMethod: 'session',
    },
  };
}

function extractMcpApiKey(request: Request): string | undefined {
  return request.headers.get('x-mcp-api-key')?.trim();
}

async function authenticatePersonalApiKey(plainKey: string): Promise<McpAuthResult> {
  const service = createServiceRoleClient();
  if (!service) {
    return authFailure('service_role_not_configured', plainKey);
  }

  try {
    const row = await findActiveKeyByHash(service, hashMcpApiKey(plainKey));
    if (!row) {
      return authFailure('invalid_mcp_personal_key', plainKey);
    }

    void touchKeyLastUsed(service, row.id);

    return {
      ok: true,
      context: {
        supabase: service,
        userId: row.user_id,
        authMethod: 'api_key',
      },
    };
  } catch (error) {
    console.error('[mcp-auth] personal key lookup failed', error);
    return authFailure('mcp_personal_key_lookup_failed', plainKey);
  }
}

async function authenticateSessionAccessToken(accessToken: string): Promise<McpAuthResult> {
  let supabase: SupabaseClient;
  try {
    supabase = createUserScopedClient(accessToken);
  } catch {
    return authFailure('supabase_not_configured', accessToken);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return authFailure('invalid_access_token', accessToken);
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      userEmail: user.email,
      authMethod: 'session',
    },
  };
}

export async function authenticateMcpRequest(request: Request): Promise<McpAuthResult> {
  const requiredSecret = process.env.MCP_API_SECRET?.trim();
  if (requiredSecret) {
    const provided = extractMcpApiKey(request);
    const accessToken = extractBearerToken(request);
    if (!provided || provided !== requiredSecret) {
      return authFailure('invalid_mcp_api_key', accessToken);
    }
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return authFailure('missing_access_token');
  }

  if (isMcpPersonalApiKey(accessToken)) {
    return authenticatePersonalApiKey(accessToken);
  }

  return authenticateSessionAccessToken(accessToken);
}
