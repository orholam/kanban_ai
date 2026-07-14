-- Long-lived per-user MCP API keys (kai_…). Access only via service role —
-- no policies for anon/authenticated so key material never hits the Data API.

CREATE TABLE IF NOT EXISTS public.mcp_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Connect AI',
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  key_encrypted text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS mcp_api_keys_key_hash_uidx
  ON public.mcp_api_keys (key_hash);

CREATE INDEX IF NOT EXISTS mcp_api_keys_user_active_idx
  ON public.mcp_api_keys (user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.mcp_api_keys FROM anon, authenticated;
GRANT ALL ON public.mcp_api_keys TO postgres, service_role;

COMMENT ON TABLE public.mcp_api_keys IS
  'MCP personal access keys for Cursor/Claude. Plaintext never stored; encrypted blob is for Connect AI config rebuild only.';
