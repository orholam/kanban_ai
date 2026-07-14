import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const MCP_PERSONAL_KEY_PREFIX = 'kai_';

type McpApiKeyRow = {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  key_encrypted: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

function asError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message || fallback);
    const code =
      'code' in error && (error as { code?: unknown }).code != null
        ? ` [${String((error as { code: unknown }).code)}]`
        : '';
    return new Error(`${message}${code}`);
  }
  return new Error(fallback);
}

function requireEncryptionSecret(): string {
  const secret =
    process.env.MCP_KEY_ENCRYPTION_SECRET?.trim() ||
    process.env.MCP_API_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error(
      'Set MCP_KEY_ENCRYPTION_SECRET, MCP_API_SECRET, or SUPABASE_SERVICE_ROLE_KEY to manage MCP API keys.'
    );
  }
  return secret;
}

function encryptionKeyBytes(): Buffer {
  return createHash('sha256').update(requireEncryptionSecret()).digest();
}

export function hashMcpApiKey(plainKey: string): string {
  return createHash('sha256').update(plainKey).digest('hex');
}

export function isMcpPersonalApiKey(token: string): boolean {
  return token.startsWith(MCP_PERSONAL_KEY_PREFIX) && token.length > MCP_PERSONAL_KEY_PREFIX.length + 16;
}

export function generateMcpApiKeyPlaintext(): string {
  return `${MCP_PERSONAL_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
}

function encryptKey(plainKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKeyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plainKey, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptMcpApiKey(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted MCP key payload');
  }
  const decipher = createDecipheriv('aes-256-gcm', encryptionKeyBytes(), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]).toString('utf8');
}

export async function findActiveKeyByHash(
  service: SupabaseClient,
  keyHash: string
): Promise<McpApiKeyRow | null> {
  const { data, error } = await service
    .from('mcp_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw asError(error, 'MCP API key lookup failed');
  return (data as McpApiKeyRow | null) ?? null;
}

export async function touchKeyLastUsed(service: SupabaseClient, keyId: string): Promise<void> {
  const { error } = await service
    .from('mcp_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyId);
  if (error) {
    console.warn('[mcp-api-keys] failed to update last_used_at', error.message);
  }
}

export async function getActiveKeyForUser(
  service: SupabaseClient,
  userId: string
): Promise<McpApiKeyRow | null> {
  const { data, error } = await service
    .from('mcp_api_keys')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw asError(error, 'Failed to load MCP API key');
  return (data as McpApiKeyRow | null) ?? null;
}

export async function revokeActiveKeysForUser(service: SupabaseClient, userId: string): Promise<void> {
  const { error } = await service
    .from('mcp_api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);
  if (error) throw asError(error, 'Failed to revoke MCP API keys');
}

export async function createMcpApiKey(
  service: SupabaseClient,
  userId: string,
  name = 'Connect AI'
): Promise<{ plainKey: string; row: McpApiKeyRow }> {
  const plainKey = generateMcpApiKeyPlaintext();
  const row = {
    user_id: userId,
    name,
    key_prefix: plainKey.slice(0, 12),
    key_hash: hashMcpApiKey(plainKey),
    key_encrypted: encryptKey(plainKey),
  };
  const { data, error } = await service.from('mcp_api_keys').insert([row]).select('*').single();
  if (error) throw asError(error, 'Failed to create MCP API key');
  return { plainKey, row: data as McpApiKeyRow };
}

/** Resolve a long-lived personal key for Connect AI config (create or reuse). */
export async function resolvePlainMcpApiKey(
  service: SupabaseClient,
  userId: string,
  options: { rotate?: boolean } = {}
): Promise<{ plainKey: string; keyPrefix: string; rotated: boolean }> {
  if (options.rotate) {
    await revokeActiveKeysForUser(service, userId);
    const created = await createMcpApiKey(service, userId);
    return { plainKey: created.plainKey, keyPrefix: created.row.key_prefix, rotated: true };
  }

  const existing = await getActiveKeyForUser(service, userId);
  if (existing) {
    return {
      plainKey: decryptMcpApiKey(existing.key_encrypted),
      keyPrefix: existing.key_prefix,
      rotated: false,
    };
  }

  const created = await createMcpApiKey(service, userId);
  return { plainKey: created.plainKey, keyPrefix: created.row.key_prefix, rotated: false };
}
