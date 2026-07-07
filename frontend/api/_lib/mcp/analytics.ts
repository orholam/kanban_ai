import { createClient } from '@supabase/supabase-js';

export type McpAnalyticsEventType = 'mcp_tool_call' | 'mcp_auth_failure' | 'mcp_session';

const MCP_AUTH_FAILURE_SESSION = 'mcp_auth_failure';

function readSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not configured');
  return url;
}

function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) return null;
  return createClient(readSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function recordMcpAnalyticsEvent(
  eventType: McpAnalyticsEventType,
  metadata: Record<string, unknown>,
  userId?: string | null
): Promise<void> {
  const payload = {
    event: eventType,
    ...metadata,
    recorded_at: new Date().toISOString(),
  };

  console.info('[mcp-analytics]', JSON.stringify(payload));

  const client = createServiceClient();
  if (!client) {
    console.warn('[mcp-analytics] SUPABASE_SERVICE_ROLE_KEY not set; event logged to console only');
    return;
  }

  const row =
    eventType === 'mcp_auth_failure'
      ? {
          user_id: null,
          guest_session_id: MCP_AUTH_FAILURE_SESSION,
          event_type: eventType,
          metadata,
        }
      : {
          user_id: userId ?? null,
          guest_session_id: null,
          event_type: eventType,
          metadata,
        };

  if (!row.user_id && eventType !== 'mcp_auth_failure') {
    console.warn('[mcp-analytics] skipping DB insert without user_id for', eventType);
    return;
  }

  const { error } = await client.from('analytics_events').insert(row);
  if (error) {
    console.warn('[mcp-analytics] insert failed:', error.message);
  }
}

export async function recordMcpToolCall(input: {
  toolName: string;
  userId: string;
  success: boolean;
  durationMs: number;
  error?: string;
  projectId?: string;
}): Promise<void> {
  void recordMcpAnalyticsEvent(
    'mcp_tool_call',
    {
      tool_name: input.toolName,
      success: input.success,
      duration_ms: input.durationMs,
      ...(input.error ? { error: input.error } : {}),
      ...(input.projectId ? { project_id: input.projectId } : {}),
    },
    input.userId
  );
}

export function recordMcpAuthFailure(input: { reason: string }): void {
  void recordMcpAnalyticsEvent('mcp_auth_failure', { reason: input.reason });
}

export function recordMcpSession(input: { userId: string; method: string }): void {
  void recordMcpAnalyticsEvent('mcp_session', { method: input.method }, input.userId);
}
