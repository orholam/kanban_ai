import type { VercelRequest, VercelResponse } from '@vercel/node';

export const MCP_CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-MCP-API-Key, X-Supabase-Access-Token, Mcp-Session-Id, MCP-Protocol-Version',
  'Access-Control-Expose-Headers':
    'WWW-Authenticate, RateLimit, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After',
};

export function publicOrigin(req: VercelRequest): string {
  const host = typeof req.headers.host === 'string' ? req.headers.host : 'kanbanai.dev';
  const proto =
    (typeof req.headers['x-forwarded-proto'] === 'string' && req.headers['x-forwarded-proto']) || 'https';
  return `${proto}://${host}`;
}

export function mcpWwwAuthenticate(req: VercelRequest): string {
  const metadata = `${publicOrigin(req)}/.well-known/oauth-protected-resource`;
  return `Bearer realm="Kanban AI MCP", error="invalid_token", resource_metadata="${metadata}"`;
}

export function clientIp(req: VercelRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',')[0]?.trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  return undefined;
}

export function applyHeaders(res: VercelResponse, headers: Record<string, string>): void {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}
