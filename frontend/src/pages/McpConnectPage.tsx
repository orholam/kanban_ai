import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Clipboard,
  ClipboardCheck,
  Plug,
  Sparkles,
  Terminal,
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
  buildCursorMcpConfig,
  buildMcpRemoteCommand,
  getMcpEndpointUrl,
} from '../lib/mcpSetup';
import { documentationBoardArticlePath } from '../documentation-board-feature/integration';

type CopyField = 'token' | 'cursor' | 'claude' | null;

export default function McpConnectPage({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [mcpSecret, setMcpSecret] = useState('');
  const [loadingToken, setLoadingToken] = useState(true);
  const [copied, setCopied] = useState<CopyField>(null);

  const endpoint = useMemo(() => getMcpEndpointUrl(), []);

  const refreshToken = useCallback(async () => {
    setLoadingToken(true);
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      toast.error('Could not read session');
      setAccessToken(null);
    } else {
      setAccessToken(data.session?.access_token ?? null);
    }
    setLoadingToken(false);
  }, []);

  useEffect(() => {
    if (!user || isLocalAppMode()) return;
    void refreshToken();
  }, [user, refreshToken]);

  const copyText = async (text: string, field: CopyField, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Copy failed — select and copy manually');
    }
  };

  const cursorConfig = useMemo(() => {
    if (!accessToken) return '';
    return buildCursorMcpConfig({ accessToken, mcpApiSecret: mcpSecret || undefined, endpointUrl: endpoint });
  }, [accessToken, mcpSecret, endpoint]);

  const claudeCommand = useMemo(() => {
    if (!accessToken) return '';
    return buildMcpRemoteCommand({ accessToken, mcpApiSecret: mcpSecret || undefined, endpointUrl: endpoint });
  }, [accessToken, mcpSecret, endpoint]);

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
          <Plug className={`h-10 w-10 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
          <h1 className="text-xl font-semibold">MCP requires hosted mode</h1>
          <p className="max-w-md text-sm leading-relaxed text-zinc-500">
            The MCP server runs on your deployed Vercel API. Local SQLite mode does not expose{' '}
            <code className="rounded bg-black/10 px-1">/api/mcp</code>. Sign in on{' '}
            <strong>kanbanai.dev</strong> to use Connect AI, or run Supabase +{' '}
            <code className="rounded bg-black/10 px-1">vercel dev</code> locally.
          </p>
          <Link
            to={documentationBoardArticlePath(MCP_DOCS_SLUG)}
            className={`text-sm font-semibold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
          >
            Read the MCP guide
          </Link>
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
    ? 'rounded-xl border border-zinc-700/80 bg-zinc-950 p-4 font-mono text-xs text-zinc-300'
    : 'rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-800';

  const steps = [
    { n: 1, title: 'Copy your token', desc: 'Proves MCP requests are you' },
    { n: 2, title: 'Add API secret', desc: 'From your Vercel deployment' },
    { n: 3, title: 'Paste into Cursor or Claude', desc: 'Restart the client' },
  ];

  return (
    <>
      <SEO
        title="Connect AI — Kanban AI"
        description="Set up Kanban AI with Claude Desktop, Cursor, and other MCP clients."
        noindex
      />
      <div className={`min-h-0 flex-1 overflow-y-auto ${shell}`}>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {/* Hero */}
          <div className={`relative overflow-hidden p-8 sm:p-10 ${panel}`}>
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-teal-500/20 to-indigo-500/20 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-300">
                <Plug className="h-3.5 w-3.5" />
                Model Context Protocol
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Connect Claude or Cursor to your boards</h1>
              <p className={`mt-3 max-w-xl text-sm leading-relaxed ${muted}`}>
                Your AI editor can list projects, move tasks, and read sprint context—using the same data as this app.
                Setup takes about two minutes.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {steps.map((s) => (
                  <div
                    key={s.n}
                    className={`rounded-xl border p-3 ${
                      isDarkMode ? 'border-zinc-700/60 bg-zinc-800/40' : 'border-zinc-200 bg-zinc-50/80'
                    }`}
                  >
                    <span className="text-lg font-bold text-teal-500">{s.n}</span>
                    <p className="mt-1 text-sm font-semibold">{s.title}</p>
                    <p className={`text-xs ${muted}`}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 1: Token */}
          <section className={`mt-6 p-6 ${panel}`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-600 dark:text-teal-300">
                1
              </span>
              Your access token
            </h2>
            <p className={`mt-2 text-sm ${muted}`}>
              MCP authenticates as <strong>you</strong>. Copy this token into your client config. It expires—refresh here
              when connections fail.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loadingToken || !accessToken}
                onClick={() => accessToken && copyText(accessToken, 'token', 'Access token')}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
              >
                {copied === 'token' ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                Copy access token
              </button>
              <button
                type="button"
                onClick={() => void refreshToken()}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  isDarkMode ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                }`}
              >
                Refresh token
              </button>
            </div>
            {accessToken ? (
              <pre className={`mt-4 max-h-24 overflow-auto break-all ${codeBlock}`}>
                {accessToken.slice(0, 48)}…
              </pre>
            ) : (
              <p className={`mt-4 text-sm ${muted}`}>No active session token. Try signing out and back in.</p>
            )}
          </section>

          {/* Step 2: Secret */}
          <section className={`mt-6 p-6 ${panel}`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-600 dark:text-teal-300">
                2
              </span>
              MCP API secret
            </h2>
            <p className={`mt-2 text-sm ${muted}`}>
              Your deployment operator sets <code className="rounded bg-black/5 px-1">MCP_API_SECRET</code> in Vercel.
              Paste it here so generated configs are ready to use. Leave blank only if your deployment does not require
              it.
            </p>
            <input
              type="password"
              value={mcpSecret}
              onChange={(e) => setMcpSecret(e.target.value)}
              placeholder="Paste MCP_API_SECRET from Vercel"
              className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm ${
                isDarkMode
                  ? 'border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600'
                  : 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <p className={`mt-2 text-xs ${muted}`}>
              Endpoint: <code className="font-mono">{endpoint}</code>
            </p>
          </section>

          {/* Step 3: Configs */}
          <section className={`mt-6 p-6 ${panel}`}>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-xs font-bold text-teal-600 dark:text-teal-300">
                3
              </span>
              Client configuration
            </h2>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Cursor (recommended)</h3>
                <button
                  type="button"
                  disabled={!cursorConfig}
                  onClick={() => cursorConfig && copyText(cursorConfig, 'cursor', 'Cursor MCP config')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                    isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  {copied === 'cursor' ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                  Copy JSON
                </button>
              </div>
              <p className={`mb-2 text-xs ${muted}`}>
                Cursor Settings → MCP → add server, or edit <code className="font-mono">~/.cursor/mcp.json</code>
              </p>
              <pre className={`max-h-64 overflow-auto whitespace-pre-wrap ${codeBlock}`}>
                {cursorConfig || 'Sign in and refresh your token to generate config.'}
              </pre>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Terminal className="h-4 w-4" />
                  Claude Desktop / stdio clients
                </h3>
                <button
                  type="button"
                  disabled={!claudeCommand}
                  onClick={() => claudeCommand && copyText(claudeCommand, 'claude', 'mcp-remote command')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                    isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  {copied === 'claude' ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
                  Copy command
                </button>
              </div>
              <p className={`mb-2 text-xs ${muted}`}>
                Use <code className="font-mono">mcp-remote</code> to proxy HTTP MCP over stdio. See full JSON example in
                docs.
              </p>
              <pre className={`overflow-x-auto whitespace-pre-wrap ${codeBlock}`}>{claudeCommand || '—'}</pre>
            </div>
          </section>

          {/* Tools & prompts */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className={`p-6 ${panel}`}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <Wrench className="h-4 w-4 text-teal-500" />
                {MCP_TOOLS.length} tools available
              </h2>
              <ul className={`space-y-2 text-sm ${muted}`}>
                {MCP_TOOLS.map((t) => (
                  <li key={t.name} className="flex gap-2">
                    <code className={`shrink-0 font-mono text-xs ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>
                      {t.name}
                    </code>
                    <span>{t.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`p-6 ${panel}`}>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Try asking your AI
              </h2>
              <ul className="space-y-3">
                {MCP_EXAMPLE_PROMPTS.map((prompt) => (
                  <li
                    key={prompt}
                    className={`rounded-lg border px-3 py-2 text-sm italic ${
                      isDarkMode ? 'border-zinc-700/60 bg-zinc-800/30 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    &ldquo;{prompt}&rdquo;
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className={`mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
            isDarkMode ? 'border-indigo-500/30 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50/50'
          }`}>
            <p className={`text-sm ${muted}`}>
              Full walkthrough, troubleshooting, and security notes live in the docs.
            </p>
            <Link
              to={documentationBoardArticlePath(MCP_DOCS_SLUG)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
            >
              MCP documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
