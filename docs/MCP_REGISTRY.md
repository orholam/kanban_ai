# MCP Registry publication (Kanban AI)

Kanban AI exposes a **remote** MCP server at `https://kanbanai.dev/api/mcp` (Streamable HTTP via [`mcp-handler`](https://www.npmjs.com/package/mcp-handler) on Vercel). The official [MCP Registry](https://modelcontextprotocol.io/registry/about) supports remote servers through the `remotes` field in `server.json` — **no npm package is required** for remote-only publication.

Registry metadata lives at the repository root: [`server.json`](../server.json).

| Field | Value |
| --- | --- |
| Registry name | `io.github.orholam/kanban-ai` |
| Version | `1.0.0` (matches `serverInfo.version` in `frontend/api/mcp.ts`) |
| Transport | `streamable-http` |
| Endpoint | `https://kanbanai.dev/api/mcp` |

> **Note:** `frontend/package.json` uses `0.0.0` for the web app. Bump `server.json` `version` when you ship MCP-facing changes (and keep it aligned with `serverInfo.version` in `frontend/api/mcp.ts`).

## Prerequisites

1. **GitHub account** — must match the namespace `io.github.orholam/*` (repo owner: [orholam/kanban_ai](https://github.com/orholam/kanban_ai)).
2. **Production MCP endpoint** — publicly reachable at `https://kanbanai.dev/api/mcp`.
3. **Publisher CLI** — `mcp-publisher` (see install below).

## Client authentication (documented in `server.json`)

Each MCP request must include:

| Header | Required | Purpose |
| --- | --- | --- |
| `Authorization` | Yes | `Bearer <supabase_access_token>` for the signed-in user |
| `X-MCP-API-Key` | Yes on production | Shared secret when `MCP_API_SECRET` is set on Vercel |
| `X-Supabase-Access-Token` | No | Alternative to `Authorization` for clients that cannot send Bearer |

End users obtain tokens and headers from **Connect AI** (`/connect`) or `GET /api/mcp-setup` while signed in. **Never commit tokens or `MCP_API_SECRET` to the repository.**

## Install `mcp-publisher`

Use the **latest release** from GitHub (currently **v1.7.x**). The **Snap package is outdated** — it lacks `validate` and incorrectly rejects the current schema.

```bash
# Install official binary (puts mcp-publisher in /usr/local/bin, ahead of /snap/bin)
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" \
  | tar xz mcp-publisher
sudo mv mcp-publisher /usr/local/bin/

# Confirm you're not still on Snap (should print /usr/local/bin/mcp-publisher)
which mcp-publisher
mcp-publisher --help   # should list: init, login, logout, publish, validate, status
```

Optional — remove the Snap build so it cannot shadow the new binary:

```bash
sudo snap remove mcp-publisher
```

**Homebrew (macOS):** `brew install mcp-publisher`

## Validate before publishing (optional)

Requires **mcp-publisher v1.3+** (not available in the Snap build). Checks JSON schema and registry rules without uploading:

```bash
mcp-publisher validate server.json
```

Expected success output:

```text
✅ server.json is valid
```

If your CLI only lists `init`, `login`, `logout`, `publish` — upgrade using the install section above.

## Authenticate with GitHub

Publishing to `io.github.orholam/kanban-ai` requires GitHub namespace auth. This step is **interactive** (browser OAuth):

```bash
mcp-publisher login github
```

- Opens a browser to authorize the MCP Registry.
- Grants publish access to `io.github.orholam/*` (and org namespaces you belong to).
- Stores a JWT in `~/.config/mcp-publisher/token.json`.

Re-authenticate if publish fails with an expired token:

```bash
mcp-publisher logout
mcp-publisher login github
```

## Publish

From the repository root (where `server.json` lives):

```bash
mcp-publisher publish server.json
```

The registry will:

1. Validate `server.json` against the official schema.
2. Verify GitHub namespace ownership (`io.github.orholam`).
3. For **remote-only** servers, confirm the `remotes` entry (no npm `mcpName` / package publish needed).

On success, the server appears in the [MCP Registry](https://registry.modelcontextprotocol.io) API and downstream marketplaces that consume it.

## Updating or deprecating a version

```bash
# Publish a new version (bump version in server.json first)
mcp-publisher publish server.json

# Deprecate an old version
mcp-publisher status --status deprecated --message "Upgrade to 1.1.0" \
  io.github.orholam/kanban-ai 1.0.0
```

## Troubleshooting

| Error | Action |
| --- | --- |
| `Unknown command: validate` | Snap / old CLI. Upgrade to latest binary; `which mcp-publisher` should be `/usr/local/bin/mcp-publisher`. |
| `deprecated schema detected` … `2025-12-11` | **Upgrade `mcp-publisher`** to the latest release (see install above). Older versions (e.g. v1.1.x via Snap) reject schemas that the current registry accepts. After upgrading, **re-login** — token path moved to `~/.config/mcp-publisher/`. |
| `hint: token storage moved to ~/.config/mcp-publisher/` | You upgraded the CLI; run `mcp-publisher login github` again, then `mcp-publisher publish server.json`. |
| `You do not have permission to publish this server` | Run `mcp-publisher login github` as the **orholam** GitHub user; name must be `io.github.orholam/kanban-ai`. |
| `Invalid or expired Registry JWT token` | `mcp-publisher logout` then `mcp-publisher login github`. |
| `Registry validation failed for package` | Only applies if you add a `packages` entry. Remote-only publication should not need npm. |
| Validation errors on `description` | Max 100 characters (schema limit). |
| Remote URL unreachable | Ensure `https://kanbanai.dev/api/mcp` responds (401 without auth is OK; connection must succeed). |

## Optional: npm wrapper (not required)

If you later add a `packages` entry (e.g. stdio via `mcp-remote` for Claude Desktop), you would need:

1. A public npm package with `"mcpName": "io.github.orholam/kanban-ai"` in `package.json`.
2. `npm publish --access public` before `mcp-publisher publish`.

For the current **remote-only** setup, skip this step.

## References

- [MCP Registry — About](https://modelcontextprotocol.io/registry/about)
- [Publishing remote servers](https://modelcontextprotocol.io/registry/remote-servers)
- [Publisher quickstart](https://modelcontextprotocol.io/registry/quickstart)
- [Publisher CLI commands](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/cli/commands.md)
- Kanban AI MCP operator docs: [README — MCP server](../README.md#mcp-server-claude-cursor-other-ai-tools)
