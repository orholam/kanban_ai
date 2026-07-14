#!/usr/bin/env bash
# Apply mcp_api_keys migration to the Kanban Supabase project.
#
# Option A — Supabase SQL editor (no CLI):
#   1. Open https://supabase.com/dashboard/project/mruhzlixrwsgwqaodviy/sql/new
#   2. Paste the contents of supabase/migrations/20260714120000_mcp_api_keys.sql
#   3. Run, then reload https://kanbanai.dev/connect and click "Rotate key"
#
# Option B — Supabase CLI (needs login + project link):
#   supabase login
#   supabase link --project-ref mruhzlixrwsgwqaodviy
#   supabase db push
#
# Option C — psql with direct connection string:
#   DATABASE_URL='postgresql://postgres.[ref]:[password]@...' ./scripts/apply-mcp-api-keys-migration.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION="$ROOT/supabase/migrations/20260714120000_mcp_api_keys.sql"

if [[ ! -f "$MIGRATION" ]]; then
  echo "Migration file not found: $MIGRATION" >&2
  exit 1
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Applying migration via psql..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION"
  echo "Done. Reload /connect on kanbanai.dev."
  exit 0
fi

echo "No DATABASE_URL set."
echo ""
echo "Paste this SQL in the Supabase SQL editor for project mruhzlixrwsgwqaodviy:"
echo "  https://supabase.com/dashboard/project/mruhzlixrwsgwqaodviy/sql/new"
echo ""
cat "$MIGRATION"
