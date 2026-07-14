import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ChevronDown,
  Clipboard,
  ClipboardCheck,
  ExternalLink,
  Plug,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { isLocalAppMode } from '../lib/localApp';
import {
  MCP_DOCS_SLUG,
  MCP_EXAMPLE_PROMPTS,
  MCP_TOOLS,
  buildMcpClientSetup,
  fetchMcpSetup,
  getMcpEndpointUrl,
  mcpSetupFallbackMessage,
  type McpSetupResponse,
} from '../lib/mcpSetup';
import { documentationBoardArticlePath } from '../documentation-board-feature/integration';

type ClientTab = 'cursor' | 'claude';

export default function McpConnectPage({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth();
  const [setup, setSetup] = useState<McpSetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [clientTab, setClientTab] = useState<ClientTab>('cursor');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const loadSetup = useCallback(async (options: { rotate?: boolean } = {}) => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) {
      setSetup(null);
      setLoadError('No active session. Try signing out and back in.');
      setLoading(false);
      return;
    }

    const token = data.session.access_token;
    try {
      const remote = await fetchMcpSetup(token, options);
      setSetup(remote);
      if (options.rotate) {
        if (remote.authMode === 'personal_key') {
          toast.success('New MCP key issued — paste the updated config into your client');
        } else {
          toast.info('Config refreshed with your current session token');
        }
      }
    } catch (err) {
      const fallback = buildMcpClientSetup({
        accessToken: token,
        endpointUrl: getMcpEndpointUrl(),
      });
      setSetup({
        endpoint: fallback.endpoint,
        cursorConfig: fallback.cursorConfig,
        claudeConfig: fallback.claudeConfig,
        keyPrefix: null,
        expiresAt: fallback.tokenExpiresAt,
        authMode: 'session_jwt',
        setupNotice: null,
      });
      const detail = err instanceof Error ? err.message : 'Unknown error';
      setLoadError(`${mcpSetupFallbackMessage()} (${detail})`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user || isLocalAppMode()) return;
    void loadSetup();
  }, [user, loadSetup]);

  const activeConfig = setup ? (clientTab === 'cursor' ? setup.cursorConfig : setup.claudeConfig) : '';

  const copyConfig = async () => {
    if (!activeConfig) return;
    try {
      await navigator.clipboard.writeText(activeConfig);
      setCopied(true);
      toast.success('Config copied — paste into your MCP settings');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Copy failed — select the config and copy manually');
    }
  };

  if (!user) {
    return <Navigate to="/login?next=/connect" replace />;
  }

  if (isLocalAppMode()) {
    return (
      <>
        <SEO title="Connect AI — Kanban AI" description="MCP setup for Claude and Cursor." noindex />
        <div
          className={`flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center ${
            isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-zinc-50 text-zinc-800'
          }`}
        >
          <Plug className={`h-10 w-10 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <h1 className="text-xl font-semibold">Connect on kanbanai.dev</h1>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            MCP runs on the hosted API. Sign in at{' '}
            <a href="https://kanbanai.dev/connect" className="font-semibold text-indigo-600 underline-offset-2 hover:underline">
              kanbanai.dev/connect
            </a>{' '}
            for one-click config, or run <code className="rounded bg-black/10 px-1">vercel dev</code> locally.
          </p>
        </div>
      </>
    );
  }

  const shell = isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900';
  const panel = isDarkMode
    ? 'rounded-2xl border border-zinc-800/80 bg-zinc-900/50'
    : 'rounded-2xl border border-zinc-200/90 bg-white shadow-sm';
  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const codeBlock = isDarkMode
    ? 'rounded-xl border border-zinc-700/80 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300'
    : 'rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800';

  const pasteSteps =
    clientTab === 'cursor'
      ? [
          'Open Cursor → Settings → MCP (or edit ~/.cursor/mcp.json)',
          'Add a new server and paste the copied JSON',
          'Restart Cursor or click Refresh on MCP servers',
        ]
      : [
          'Open Claude Desktop config: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)',
          'Paste the copied JSON under mcpServers (merge if you already have servers)',
          'Quit and reopen Claude Desktop',
        ];

  return (
    <>
      <SEO
        title="Connect AI — Kanban AI"
        description="Set up Kanban AI with Claude Desktop, Cursor, and other MCP clients."
        noindex
      />
      <div className={`min-h-0 flex-1 overflow-y-auto ${shell}`}>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <div className={`p-6 sm:p-8 ${panel}`}>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              <Plug className="h-3.5 w-3.5" />
              Connect AI
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Hook up Cursor or Claude in one copy</h1>
            <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
              {setup?.authMode === 'session_jwt' ? (
                <>
                  Copy the config below to connect now. Long-lived personal keys require a one-time database setup on
                  our side — until then your session token works for about an hour.
                </>
              ) : (
                <>
                  We issue a long-lived personal MCP key and fill in your config. Copy once, paste into your editor,
                  restart — no hourly reconnects.
                </>
              )}
            </p>
          </div>

          <section className={`mt-6 p-6 sm:p-8 ${panel}`}>
            <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/80">
              {(
                [
                  { id: 'cursor' as const, label: 'Cursor' },
                  { id: 'claude' as const, label: 'Claude Desktop' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setClientTab(id)}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    clientTab === id
                      ? isDarkMode
                        ? 'bg-zinc-700 text-white shadow-sm'
                        : 'bg-white text-zinc-900 shadow-sm'
                      : muted
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <ol className="mt-6 space-y-4">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Copy your config</p>
                  <p className={`mt-0.5 text-sm ${muted}`}>
                    {setup?.authMode === 'session_jwt' ? (
                      <>
                        Temporary session token included — it expires in about an hour. After we finish MCP key setup,
                        regenerate for a long-lived key
                        {setup.expiresAt ? (
                          <>
                            {' '}
                            (expires{' '}
                            {new Date(setup.expiresAt * 1000).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                            )
                          </>
                        ) : null}
                        .
                      </>
                    ) : (
                      <>
                        Includes a personal key that does not expire
                        {setup?.keyPrefix ? (
                          <>
                            {' '}
                            (<code className="font-mono text-xs">{setup.keyPrefix}…</code>)
                          </>
                        ) : null}
                        .
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    disabled={loading || !activeConfig}
                    onClick={() => void copyConfig()}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy config'}
                  </button>
                  {setup?.setupNotice ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{setup.setupNotice}</p>
                  ) : null}
                  {loadError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{loadError}</p> : null}
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                  2
                </span>
                <div>
                  <p className="font-semibold">Paste into {clientTab === 'cursor' ? 'Cursor' : 'Claude'}</p>
                  <ul className={`mt-2 list-inside list-decimal space-y-1.5 text-sm ${muted}`}>
                    {pasteSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </li>
            </ol>

            {!loading && activeConfig ? (
              <details className="mt-6">
                <summary className={`cursor-pointer text-sm font-medium ${muted}`}>Preview config</summary>
                <pre className={`mt-3 max-h-48 overflow-auto whitespace-pre-wrap ${codeBlock}`}>{activeConfig}</pre>
              </details>
            ) : loading ? (
              <p className={`mt-6 text-sm ${muted}`}>Preparing your config…</p>
            ) : null}

            <button
              type="button"
              onClick={() => void loadSetup({ rotate: true })}
              className={`mt-4 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400`}
            >
              Rotate key &amp; regenerate config
            </button>
          </section>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`mt-4 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium ${
              isDarkMode ? 'border-zinc-800 text-zinc-300' : 'border-zinc-200 text-zinc-700'
            }`}
          >
            When connection stops working
            <ChevronDown className={`h-4 w-4 transition ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          {showAdvanced ? (
            <div className={`mt-2 rounded-xl border p-4 text-sm ${isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}>
              <p>
                Personal MCP keys do not expire. If you get <code className="font-mono text-xs">401</code>, someone
                may have revoked the key, or the deployment secret changed — click{' '}
                <strong>Rotate key &amp; regenerate config</strong> and paste the new JSON into your client.
              </p>
              {setup?.endpoint ? (
                <p className="mt-2">
                  Endpoint: <code className="font-mono text-xs">{setup.endpoint}</code>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <section className={`p-5 ${panel}`}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <Wrench className="h-4 w-4 text-indigo-500" />
                {MCP_TOOLS.length} tools
              </h2>
              <ul className={`space-y-1.5 text-xs ${muted}`}>
                {MCP_TOOLS.slice(0, 5).map((t) => (
                  <li key={t.name}>
                    <code className={isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}>{t.name}</code>
                  </li>
                ))}
                <li className="pt-1 italic">+ {MCP_TOOLS.length - 5} more</li>
              </ul>
            </section>
            <section className={`p-5 ${panel}`}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Try asking
              </h2>
              <p className={`text-xs italic ${muted}`}>&ldquo;{MCP_EXAMPLE_PROMPTS[0]}&rdquo;</p>
            </section>
          </div>

          <div
            className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              isDarkMode ? 'border-indigo-500/30 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/50'
            }`}
          >
            <p className={`text-sm ${muted}`}>Troubleshooting and security notes</p>
            <Link
              to={documentationBoardArticlePath(MCP_DOCS_SLUG)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
            >
              MCP docs
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
