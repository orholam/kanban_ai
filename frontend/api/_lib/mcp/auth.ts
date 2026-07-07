import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type McpAuthContext = {
  supabase: SupabaseClient;
  userId: string;
  userEmail?: string;
};

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

function extractMcpApiKey(request: Request): string | undefined {
  return request.headers.get('x-mcp-api-key')?.trim();
}

export async function authenticateMcpRequest(request: Request): Promise<McpAuthContext | null> {
  const requiredSecret = process.env.MCP_API_SECRET?.trim();
  if (requiredSecret) {
    const provided = extractMcpApiKey(request);
    if (!provided || provided !== requiredSecret) {
      return null;
    }
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return null;
  }

  const { url, anonKey } = readSupabaseConfig();
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
    return null;
  }

  return {
    supabase,
    userId: user.id,
    userEmail: user.email,
  };
}
