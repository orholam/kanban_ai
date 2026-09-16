export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtMs: number;
};

type Bucket = { count: number; resetAtMs: number };

const WINDOW_MS = 60_000;
const AUTHENTICATED_LIMIT = 120;
const UNAUTHENTICATED_LIMIT = 30;

const buckets = new Map<string, Bucket>();

function pruneIfStale(now: number): void {
  if (buckets.size < 2_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAtMs <= now) buckets.delete(key);
  }
}

export function consumeMcpRateLimit(key: string, authenticated: boolean): RateLimitResult {
  const limit = authenticated ? AUTHENTICATED_LIMIT : UNAUTHENTICATED_LIMIT;
  const now = Date.now();
  pruneIfStale(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + WINDOW_MS;
    buckets.set(key, { count: 1, resetAtMs });
    return { allowed: true, limit, remaining: limit - 1, resetAtMs };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetAtMs: existing.resetAtMs,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfterSec = Math.max(1, Math.ceil((result.resetAtMs - Date.now()) / 1000));
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(retryAfterSec),
    RateLimit: `limit=${result.limit}, remaining=${result.remaining}, reset=${retryAfterSec}`,
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(retryAfterSec);
  }
  return headers;
}

export function mcpRateLimitKey(input: { userId?: string; ip?: string; tokenFingerprint?: string }): string {
  if (input.userId) return `user:${input.userId}`;
  if (input.tokenFingerprint) return `token:${input.tokenFingerprint}`;
  return `ip:${input.ip || 'unknown'}`;
}
