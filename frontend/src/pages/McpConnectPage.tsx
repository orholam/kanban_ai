import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, Clipboard, ClipboardCheck, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AppPageShell } from '../components/AppPageShell';
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

const ease = [0.22, 1, 0.36, 1] as const;

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
          toast.success('New MCP key issued. Paste the updated config into your client.');
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
      toast.success('Config copied. Paste it into your MCP settings.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Copy failed. Select the config and copy manually.');
    }
  };

  if (!user) {
    return <Navigate to="/login?next=/connect" replace />;
  }

  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const ink = isDarkMode ? 'text-zinc-50' : 'text-zinc-950';
  const previewSurface = isDarkMode
    ? 'border-zinc-800 bg-zinc-900'
    : 'border-zinc-200 bg-white';
  const codeBlock = isDarkMode
    ? 'rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300'
    : 'rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs leading-relaxed text-zinc-800';
  const sideItem = isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-50';

  if (isLocalAppMode()) {
    return (
      <>
        <SEO title="Connect AI — Kanban AI" description="MCP setup for Claude and Cursor." noindex />
        <AppPageShell isDarkMode={isDarkMode} maxWidth="2xl">
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <h1 className={`text-xl font-semibold ${ink}`}>Connect on kanbanai.dev</h1>
            <p className={`max-w-md text-sm leading-relaxed ${muted}`}>
              MCP runs on the hosted API. Sign in at{' '}
              <a
                href="https://kanbanai.dev/connect"
                className={`font-semibold underline-offset-4 hover:underline ${
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                kanbanai.dev/connect
              </a>{' '}
              for one-click config, or run <code className="rounded bg-black/10 px-1">vercel dev</code> locally.
            </p>
          </div>
        </AppPageShell>
      </>
    );
  }

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
      <AppPageShell isDarkMode={isDarkMode} maxWidth="5xl">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl ${ink}`}>Connect AI</h1>
            <p className={`mt-3 max-w-md text-base leading-relaxed ${muted}`}>
              {setup?.authMode === 'session_jwt' ? (
                <>
                  Copy the config below to hook up Cursor or Claude. Session tokens last about an hour until
                  long-lived keys are ready on our side.
                </>
              ) : (
                <>
                  We fill in a long-lived personal MCP key for you. Copy once, paste into your editor, restart.
                </>
              )}
            </p>

            <div
              className={`mt-8 inline-flex rounded-lg p-1 ${
                isDarkMode ? 'bg-zinc-900' : 'bg-zinc-200/80'
              }`}
            >
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
                  className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                    clientTab === id
                      ? isDarkMode
                        ? 'bg-zinc-700 text-white'
                        : 'bg-white text-zinc-900 shadow-sm'
                      : muted
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <ol className="mt-8 space-y-6">
              <li>
                <p className={`text-xs font-medium tabular-nums ${muted}`}>01</p>
                <p className={`mt-1 text-base font-semibold ${ink}`}>Copy your config</p>
                <p className={`mt-1 text-sm leading-relaxed ${muted}`}>
                  {setup?.authMode === 'session_jwt' ? (
                    <>
                      Temporary session token included. It expires in about an hour
                      {setup.expiresAt ? (
                        <>
                          {' '}
                          (
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
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:pointer-events-none disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : copied ? (
                    <ClipboardCheck className="h-4 w-4" aria-hidden />
                  ) : (
                    <Clipboard className="h-4 w-4" aria-hidden />
                  )}
                  {copied ? 'Copied' : 'Copy config'}
                </button>
                {setup?.setupNotice ? (
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{setup.setupNotice}</p>
                ) : null}
                {loadError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{loadError}</p> : null}
              </li>

              <li>
                <p className={`text-xs font-medium tabular-nums ${muted}`}>02</p>
                <p className={`mt-1 text-base font-semibold ${ink}`}>
                  Paste into {clientTab === 'cursor' ? 'Cursor' : 'Claude'}
                </p>
                <ol className={`mt-2 list-decimal space-y-1.5 pl-4 text-sm ${muted}`}>
                  {pasteSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => void loadSetup({ rotate: true })}
              className={`mt-6 text-sm font-medium underline-offset-4 hover:underline ${
                isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
              }`}
            >
              Rotate key and regenerate config
            </button>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`mt-8 flex w-full items-center justify-between border-t pt-5 text-left text-sm font-medium ${
                isDarkMode ? 'border-zinc-800 text-zinc-300' : 'border-zinc-300 text-zinc-700'
              }`}
            >
              When connection stops working
              <ChevronDown className={`h-4 w-4 transition ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced ? (
              <div className={`mt-3 text-sm leading-relaxed ${muted}`}>
                <p>
                  Personal MCP keys do not expire. If you get <code className="font-mono text-xs">401</code>, the key
                  may have been revoked or the deployment secret changed. Rotate the key and paste the new JSON into
                  your client.
                </p>
                {setup?.endpoint ? (
                  <p className="mt-2">
                    Endpoint: <code className="font-mono text-xs">{setup.endpoint}</code>
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className={`mt-8 text-sm ${muted}`}>
              Troubleshooting and security notes live in the{' '}
              <Link
                to={documentationBoardArticlePath(MCP_DOCS_SLUG)}
                className={`inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline ${
                  isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                }`}
              >
                MCP docs
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
              .
            </p>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease }}
            className="space-y-4"
          >
            <div className={`overflow-hidden rounded-2xl border ${previewSurface}`}>
              <div
                className={`flex items-center justify-between border-b px-4 py-3 ${
                  isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${ink}`}>
                    {clientTab === 'cursor' ? 'Cursor' : 'Claude'} config
                  </p>
                  <p className={`mt-0.5 text-xs ${muted}`}>
                    {loading ? 'Preparing…' : 'Ready to paste'}
                  </p>
                </div>
                <span className={`text-[11px] font-medium ${muted}`}>Preview</span>
              </div>
              <div className="p-3">
                {loading ? (
                  <div className={`flex items-center gap-2 px-1 py-8 text-sm ${muted}`}>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Preparing your config…
                  </div>
                ) : activeConfig ? (
                  <pre className={`max-h-64 overflow-auto whitespace-pre-wrap ${codeBlock}`}>{activeConfig}</pre>
                ) : (
                  <p className={`px-1 py-8 text-sm ${muted}`}>No config yet.</p>
                )}
              </div>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${previewSurface}`}>
              <div
                className={`border-b px-4 py-3 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
              >
                <p className={`text-sm font-semibold ${ink}`}>What you get</p>
                <p className={`mt-0.5 text-xs ${muted}`}>{MCP_TOOLS.length} tools on your boards</p>
              </div>
              <ul className="space-y-2 p-3">
                <motion.li
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.3, ease }}
                  className={`rounded-xl px-3 py-3 ${sideItem}`}
                >
                  <p className={`text-xs font-medium ${muted}`}>Tools</p>
                  <ul className="mt-1.5 space-y-1">
                    {MCP_TOOLS.slice(0, 5).map((t) => (
                      <li key={t.name}>
                        <code
                          className={`font-mono text-xs ${
                            isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                          }`}
                        >
                          {t.name}
                        </code>
                      </li>
                    ))}
                    <li className={`text-xs ${muted}`}>+ {MCP_TOOLS.length - 5} more</li>
                  </ul>
                </motion.li>
                <motion.li
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.3, ease }}
                  className={`rounded-xl px-3 py-3 ${sideItem}`}
                >
                  <p className={`text-xs font-medium ${muted}`}>Try asking</p>
                  <p className={`mt-1.5 text-sm leading-relaxed ${ink}`}>{MCP_EXAMPLE_PROMPTS[0]}</p>
                </motion.li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </AppPageShell>
    </>
  );
}
