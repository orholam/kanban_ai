import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type McpAuthContext = {
  supabase: SupabaseClient;
  userId: string;
  userEmail?: string;
};

export type McpAuthResult =
  | { ok: true; context: McpAuthContext }
  | { ok: false; reason: string };

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

/** Validates only the Supabase session — used for in-app setup config, not MCP tool calls. */
export async function authenticateSupabaseAccessToken(request: Request): Promise<McpAuthResult> {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return { ok: false, reason: 'missing_access_token' };
  }

  let url: string;
  let anonKey: string;
  try {
    ({ url, anonKey } = readSupabaseConfig());
  } catch {
    return { ok: false, reason: 'supabase_not_configured' };
  }

  const supabase = createClient(url, anonKey, {
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return { ok: false, reason: 'invalid_access_token' };
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      userEmail: user.email,
    },
  };
}

function extractMcpApiKey(request: Request): string | undefined {
  return request.headers.get('x-mcp-api-key')?.trim();
}

export async function authenticateMcpRequest(request: Request): Promise<McpAuthResult> {
  const requiredSecret = process.env.MCP_API_SECRET?.trim();
  if (requiredSecret) {
    const provided = extractMcpApiKey(request);
    if (!provided || provided !== requiredSecret) {
      return { ok: false, reason: 'invalid_mcp_api_key' };
    }
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return { ok: false, reason: 'missing_access_token' };
  }

  let url: string;
  let anonKey: string;
  try {
    ({ url, anonKey } = readSupabaseConfig());
  } catch {
    return { ok: false, reason: 'supabase_not_configured' };
  }

  const supabase = createClient(url, anonKey, {
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return { ok: false, reason: 'invalid_access_token' };
  }

  return {
    ok: true,
    context: {
      supabase,
      userId: user.id,
      userEmail: user.email,
    },
  };
}
