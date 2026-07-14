# Kanban AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)

Open-source AI kanban for side projects. Plan with AI, manage a board in the browser, and (optionally) drive the same board from Cursor or Claude via MCP.

**Try the hosted app:** [kanbanai.dev](https://kanbanai.dev) · **Docs:** [kanbanai.dev/docs](https://kanbanai.dev/docs)

Most people cloning this repo want the **local** app. That path is first below.

---

## Run locally (recommended)

No Supabase account, no sign-in. One SQLite database under `.local/` (gitignored). Vite serves the UI; a small local API on port **3000** handles data and OpenAI.

**Requirements:** Node.js 18+, npm, and an [OpenAI API key](https://platform.openai.com/api-keys) for AI features.

```bash
git clone https://github.com/orholam/kanban_ai.git
cd kanban_ai/frontend
npm install
cp env.local.example .env.local
```

Edit `.env.local`:

```bash
VITE_LOCAL_MODE=true
OPENAI_API_KEY=sk-...
```

Do **not** prefix the OpenAI key with `VITE_` — that would expose it in the browser.

```bash
npm run dev:local
```

Open **http://localhost:5173**.

### What works in local mode

| Feature | Local |
|---|---|
| Kanban board, sprints, tasks, comments | Yes |
| AI project builder (chat + live workspace) + board assistant | Yes (needs `OPENAI_API_KEY`) |
| Project members (invite by email) | Yes — invite `collaborator@dev.invalid` to try (seeded) |
| Cloud auth / account / hosted analytics / feedback | No (needs Supabase) |
| Remote MCP (`/api/mcp`) | No — use a hosted deploy or `vercel dev` with Supabase |

First run applies [`frontend/scripts/local-schema.sql`](frontend/scripts/local-schema.sql). Vite proxies `/api` to the local process ([`frontend/vite.config.ts`](frontend/vite.config.ts)).

### Useful scripts

| Command | What it does |
|---|---|
| `npm run dev:local` | Local SQLite API + Vite (default for contributors) |
| `npm start` | Vite only (pair with Supabase / `vercel dev`) |
| `npm run build` | Production build (+ SEO prerender; skip with `SKIP_PRERENDER=1`) |
| `npm run build:no-prerender` | Faster local production build |

---

## Optional: Supabase (cloud auth + sync)

Use this when you want real accounts, multi-device sync, or the hosted MCP server.

1. In `frontend/.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and remove `VITE_LOCAL_MODE` (or set it to anything other than `true`).
2. Keep `OPENAI_API_KEY` for `/api/openai`.
3. From `frontend/`, run two terminals: `npx vercel dev --listen 3000` then `npm start`. UI: **http://localhost:5173**.

### Deploy on Vercel

Set `OPENAI_API_KEY` (and Supabase / MCP vars below) in the Vercel project. The OpenAI key is read only on the server — never put it in `VITE_*` client env.

---

## MCP (Cursor, Claude, other agents)

On a **hosted** deployment, Kanban AI exposes a remote MCP server at `/api/mcp` with the same board operations as the web app.

- **End users:** sign in → **Connect AI** (`/connect`) → copy the generated config into Cursor or Claude Desktop. Config uses a long-lived personal MCP key (`kai_…`) so you do not need to reconnect hourly.
- **Operators:** before Connect AI can issue `kai_…` keys in production, apply `supabase/migrations/20260714120000_mcp_api_keys.sql` on the **Kanban** Supabase project (`mruhzlixrwsgwqaodviy`). Run `./scripts/apply-mcp-api-keys-migration.sh` for the SQL editor link, or `supabase db push` after linking that project.
- **Operators:** see [`docs/MCP_REGISTRY.md`](docs/MCP_REGISTRY.md) and the env table below.
- **Discovery:** [`/.well-known/mcp-server`](https://kanbanai.dev/.well-known/mcp-server) · OpenAPI: [`/openapi/mcp.json`](https://kanbanai.dev/openapi/mcp.json) · AI index: [`/llms.txt`](https://kanbanai.dev/llms.txt)

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | MCP analytics, member invites, personal MCP keys |
| `MCP_API_SECRET` | Shared secret for `X-MCP-API-Key` (also used to encrypt personal keys at rest) |
| `MCP_KEY_ENCRYPTION_SECRET` | Optional dedicated secret for encrypting personal MCP keys (falls back to `MCP_API_SECRET` / service role) |
| `OPENAI_API_KEY` | In-app AI (optional for MCP CRUD tools) |

**Tools:** `list_projects`, `get_board`, `create_project`, `update_project`, `delete_project`, `create_task`, `update_task`, `delete_task`, `list_task_comments`, `add_task_comment`, `delete_task_comment`.

---

## Features

- AI project breakdown and sprint-aware task generation
- Drag-and-drop kanban with priorities, types, due dates, and comments
- In-board AI assistant (and `@kanban` replies on task threads)
- Project members (cloud) or local seeded collaborator for sharing tests
- Dark / light mode
- Optional remote MCP so coding agents manage the same board

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS · Local: SQLite API · Hosted: Supabase + Vercel · AI: OpenAI · MCP: `mcp-handler`

## Project layout

```
frontend/
├── api/                 # Vercel serverless (OpenAI, MCP, feedback, invites)
├── scripts/             # Local schema, prerender, etc.
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── ...
├── public/              # Static assets, llms.txt, OpenAPI, .well-known
└── package.json
```

## Contributing

1. Fork and clone
2. Use **Run locally** above
3. Branch, commit, open a PR

Issues and ideas: [GitHub Issues](https://github.com/orholam/kanban_ai/issues)

## License

MIT — see [LICENSE](LICENSE).
