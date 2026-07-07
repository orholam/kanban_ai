/**
 * Landing page — Variant B.
 *
 * Premium B2B SaaS layout (iridescent hero, centered copy, floating product card).
 * Keep `onCTAClick` on every auth CTA so conversions stay tracked.
 */
import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clipboard,
  Moon,
  Plug,
  Sun,
  Terminal,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../assets/kanban_ai_logo5.png'
import promocard from '../assets/main_kanban.jpg'
import sprintPlanning from '../assets/undraw_choose_card_n0x0.svg'
import taskManagement from '../assets/undraw_join_re_w1lh.svg'
import aiAssistant from '../assets/undraw_lightbulb_moment_re_ulyo.svg'
import { McpHeroInline } from '../components/McpHeroInline'
import { TrustedBy } from '../components/TrustedBy'
import { DOCUMENTATION_BOARD_BASE_PATH, documentationBoardArticlePath } from '../documentation-board-feature/integration'
import { MCP_DOCS_SLUG } from '../lib/mcpSetup'
import { LANDING_HERO_VERSION_TAG } from '../lib/siteMeta'

const FEATURE_PILLS = [
  'Sprints',
  'AI planning',
  'MCP',
  'Weekly board',
  'Backlog',
  'Docs',
  'Roadmap',
  'Time focus',
  'Dashboards',
  'Automations',
  'Analytics',
] as const

interface Props {
  isDarkMode: boolean
  onCTAClick: () => void
  toggleTheme: () => void
}

function NavChevron() {
  return <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
}

const SHELL = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

/** Iridescent mesh gradient + faint code texture — light-first, dark fallback. */
function HeroAtmosphere({ isDarkMode }: Pick<Props, 'isDarkMode'>) {
  if (isDarkMode) {
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-zinc-950"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,189,248,0.18) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 90% 20%, rgba(167,139,250,0.14) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 10% 60%, rgba(52,211,153,0.12) 0%, transparent 50%)',
          }}
        />
      </>
    )
  }

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#f8f7fc]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 15% 10%, rgba(186,230,253,0.55) 0%, transparent 55%),
            radial-gradient(ellipse 70% 60% at 85% 5%, rgba(253,186,216,0.45) 0%, transparent 50%),
            radial-gradient(ellipse 60% 55% at 70% 75%, rgba(254,240,138,0.35) 0%, transparent 50%),
            radial-gradient(ellipse 55% 50% at 5% 70%, rgba(167,243,208,0.4) 0%, transparent 50%),
            radial-gradient(ellipse 50% 45% at 50% 45%, rgba(196,181,253,0.25) 0%, transparent 55%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'>
              <text x='12' y='28' font-family='ui-monospace, monospace' font-size='11' fill='%23000'>0101</text>
              <text x='140' y='52' font-family='ui-monospace, monospace' font-size='10' fill='%23000'>ctx</text>
              <text x='220' y='110' font-family='ui-monospace, monospace' font-size='9' fill='%23000'>+</text>
              <text x='48' y='160' font-family='ui-monospace, monospace' font-size='10' fill='%23000'>MCP</text>
              <text x='190' y='200' font-family='ui-monospace, monospace' font-size='11' fill='%23000'>1010</text>
              <text x='90' y='240' font-family='ui-monospace, monospace' font-size='9' fill='%23000'>+</text>
              <text x='250' y='260' font-family='ui-monospace, monospace' font-size='10' fill='%23000'>ai</text>
            </svg>
          `)}")`,
          maskImage: 'radial-gradient(ellipse 85% 75% at 50% 35%, black 15%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 50% 35%, black 15%, transparent 72%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 10%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 10%, transparent 75%)',
        }}
      />
    </>
  )
}

export default function LandingPageVariantB({ isDarkMode, onCTAClick, toggleTheme }: Props) {
  const [activePill, setActivePill] = useState<string>('Sprints')

  const text = isDarkMode ? 'text-zinc-50' : 'text-zinc-950'
  const textMuted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
  const textSubtle = isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
  const border = isDarkMode ? 'border-zinc-800' : 'border-zinc-200/80'
  const sectionBg = isDarkMode ? 'bg-zinc-950' : 'bg-white'
  const sectionMuted = isDarkMode ? 'bg-zinc-900/80' : 'bg-white/80'

  const navLink = isDarkMode
    ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
    : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/[0.04]'

  const pillIdle = isDarkMode
    ? 'border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600'
    : 'border border-zinc-200/90 bg-white/80 text-zinc-700 hover:border-zinc-300 backdrop-blur-sm'

  const pillActive = isDarkMode
    ? 'border-2 border-sky-500 bg-zinc-900 text-zinc-50 shadow-sm'
    : 'border-2 border-sky-500 bg-white text-zinc-900 shadow-sm'

  const checkAccent = 'text-sky-500'

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <HeroAtmosphere isDarkMode={isDarkMode} />

      {/* Floating pill nav */}
      <header className="sticky top-0 z-30 flex justify-center px-4 pb-2 pt-4 sm:pt-5">
        <div
          className={`flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 rounded-full border px-2 py-1.5 shadow-lg shadow-black/[0.04] backdrop-blur-xl sm:gap-1 sm:px-3 ${
            isDarkMode
              ? 'border-zinc-700/60 bg-zinc-900/75'
              : 'border-white/70 bg-white/75'
          }`}
        >
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 pl-1 sm:pl-2">
            <img src={Logo} alt="Kanban AI" className="h-7 w-auto sm:h-8" width={128} height={32} />
            <span className={`hidden text-sm font-bold tracking-tight sm:inline ${text}`}>Kanban AI</span>
          </Link>

          <nav
            className={`order-3 flex w-full flex-wrap items-center justify-center gap-0.5 text-[13px] font-medium sm:order-none sm:w-auto ${textMuted}`}
            aria-label="Marketing"
          >
            <a href="#features" className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1.5 ${navLink}`}>
              Product
              <NavChevron />
            </a>
            <Link
              to={DOCUMENTATION_BOARD_BASE_PATH}
              className={`inline-flex items-center rounded-full px-2 py-1.5 ${navLink}`}
            >
              Docs
            </Link>
            <a href="#pricing" className={`rounded-full px-2 py-1.5 ${navLink}`}>
              Pricing
            </a>
            <Link to="/blog" className={`rounded-full px-2 py-1.5 ${navLink}`}>
              Learn
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1 pr-1 sm:pr-2">
            <Link
              to="/login"
              className={`hidden rounded-full px-2.5 py-1.5 text-[13px] font-semibold sm:inline ${textMuted} hover:underline`}
            >
              Login
            </Link>
            <Link
              to="/login"
              onClick={onCTAClick}
              className="rounded-full bg-zinc-950 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
            >
              Sign up
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full p-1.5 transition-colors ${navLink}`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero — centered */}
      <section className={`relative z-10 pb-8 pt-8 sm:pb-12 sm:pt-12 lg:pb-16 lg:pt-14 ${SHELL}`}>
        <div className="mx-auto max-w-3xl text-center">
          <Link
            to="/blog"
            className={`mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              isDarkMode
                ? 'border-zinc-700/80 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/80'
                : 'border-white/80 bg-white/70 text-zinc-700 shadow-sm backdrop-blur-sm hover:bg-white/90'
            }`}
          >
            Sprints, backlog & AI—on one board
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums tracking-wide ${
                isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {LANDING_HERO_VERSION_TAG}
            </span>
            <ArrowRight className="h-3 w-3 opacity-60" aria-hidden />
          </Link>

          <h1
            className={`text-[2rem] font-bold leading-[1.08] tracking-tight sm:text-5xl sm:leading-[1.06] lg:text-[3.25rem] ${text}`}
          >
            Enterprise-grade sprint planning powered by AI
          </h1>
          <p className={`mx-auto mt-5 max-w-xl text-base leading-relaxed sm:text-lg ${textMuted}`}>
            Kanban AI is an AI-powered project platform that turns messy backlogs into weekly boards you can commit to.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/login"
              onClick={onCTAClick}
              className={`group relative inline-flex items-center rounded-xl px-7 py-3.5 text-[15px] font-semibold transition ${
                isDarkMode
                  ? 'bg-zinc-100 text-zinc-950 shadow-[0_2px_20px_-4px_rgba(56,189,248,0.35)] hover:bg-white'
                  : 'bg-zinc-950 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_2px_20px_-2px_rgba(251,146,60,0.35),0_8px_28px_-6px_rgba(251,191,36,0.22)] hover:bg-zinc-800'
              }`}
            >
              Get started free
              <ArrowUpRight
                className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
            <p className={`text-sm ${textSubtle}`}>Free forever · No credit card</p>
          </div>

          <McpHeroInline isDarkMode={isDarkMode} />
        </div>

        {/* Floating product mockup */}
        <div className="relative mx-auto mt-12 max-w-5xl sm:mt-14 lg:mt-16">
          <div
            className={`overflow-hidden rounded-2xl border p-1.5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.18),0_8px_24px_-8px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:p-2 ${
              isDarkMode
                ? 'border-zinc-700/60 bg-zinc-900/90'
                : 'border-white/90 bg-white/95 backdrop-blur-sm'
            }`}
          >
            <img
              src={promocard}
              alt="Kanban AI board preview"
              className="block h-auto w-full rounded-xl sm:rounded-2xl"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 -bottom-8 -z-10 h-24 bg-gradient-to-t from-white/80 to-transparent dark:from-zinc-950/80"
          />
        </div>

        <div className="mx-auto mt-12 max-w-3xl text-center sm:mt-14">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>
            What people emphasize on the board
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {FEATURE_PILLS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setActivePill(label)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${label === activePill ? pillActive : pillIdle}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {label === activePill ? (
                    <Check className="h-3.5 w-3.5 text-sky-500" strokeWidth={3} aria-hidden />
                  ) : null}
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section
        className={`relative z-10 border-y backdrop-blur-sm ${border} ${
          isDarkMode ? 'bg-zinc-900/90' : 'bg-white/70'
        }`}
      >
        <div className={`flex flex-col items-center justify-between gap-6 py-10 sm:flex-row sm:items-center ${SHELL}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${textSubtle}`}>Trusted by builders</p>
          <TrustedBy isDarkMode={isDarkMode} trustLabel="Indie hackers, founders & small crews" />
        </div>
      </section>

      {/* MCP deep-dive */}
      <section
        className={`relative z-10 scroll-mt-24 py-16 sm:py-20 ${sectionMuted} backdrop-blur-sm`}
      >
        <div className={`${SHELL} mx-auto max-w-5xl`}>
          <div className="text-center">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>
              Model Context Protocol
            </p>
            <h2 className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${text}`}>
              Your editor can manage this board
            </h2>
            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:text-base ${textMuted}`}>
              Copy your token and config from Connect AI—then ship from chat.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { n: '01', title: 'Sign in', body: 'Open Kanban AI and create a project' },
              { n: '02', title: 'Connect AI', body: 'Sidebar → Connect AI — copy token & config' },
              { n: '03', title: 'Ship from chat', body: 'Ask: “What’s blocked?” or “Add a task for…”' },
            ].map((s) => (
              <div
                key={s.n}
                className={`rounded-2xl border p-5 ${
                  isDarkMode
                    ? 'border-zinc-700/60 bg-zinc-800/40'
                    : 'border-zinc-200/80 bg-white shadow-sm shadow-black/[0.03]'
                }`}
              >
                <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{s.n}</span>
                <p className={`mt-2 font-semibold ${text}`}>{s.title}</p>
                <p className={`mt-1 text-sm ${textMuted}`}>{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              onClick={onCTAClick}
              className="inline-flex items-center rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_16px_-4px_rgba(56,189,248,0.3)] hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
            >
              Sign in to connect
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              to={documentationBoardArticlePath(MCP_DOCS_SLUG)}
              className={`inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold ${
                isDarkMode
                  ? 'bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-700'
                  : 'bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50'
              }`}
            >
              Setup guide
            </Link>
          </div>

          <div className={`mt-6 flex flex-wrap items-center justify-center gap-4 text-xs ${textSubtle}`}>
            <span className="inline-flex items-center gap-1.5">
              <Plug className="h-3.5 w-3.5 text-sky-500" /> 11 tools
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clipboard className="h-3.5 w-3.5 text-sky-500" /> One-click config
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-sky-500" /> Cursor & Claude
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className={`relative z-10 scroll-mt-24 border-b py-20 sm:py-24 ${border} ${sectionBg}`}
      >
        <div className={SHELL}>
          <div className="mx-auto max-w-2xl text-center">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>
              Product · How it works
            </p>
            <h2 className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-snug ${text}`}>
              From a messy backlog to a week you can commit to
            </h2>
          </div>

          <dl className="mx-auto mt-14 grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 sm:mt-16 sm:grid-cols-2 lg:mt-20 lg:max-w-none lg:grid-cols-4 lg:gap-y-20">
            {[
              {
                title: 'Sprint planning that fits reality',
                description:
                  'Start from goals and constraints, not blank columns. AI suggests milestones and scope so you end up with a plan you can defend—solo or with collaborators.',
                image: sprintPlanning,
              },
              {
                title: 'A weekly board you can steer',
                description:
                  'See what shipped, what slipped, and what deserves air next week. When priorities change, the board reflects it without you starting from scratch.',
                image: taskManagement,
              },
              {
                title: 'AI that speeds up the next step',
                description:
                  'Turn rough notes into cards, tighten wording, and ask follow-ups in plain language—so “what’s the next move?” is obvious before it blocks the sprint.',
                image: aiAssistant,
              },
              {
                title: 'MCP for Claude, Cursor, and more',
                description:
                  'Wire Kanban AI into MCP-compatible clients—list projects, manage tasks, and read board context from your editor or agent workflow.',
                image: taskManagement,
              },
            ].map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <img src={feature.image} alt="" className="mb-8 h-44 w-auto sm:h-48" />
                <dt className={`text-lg font-semibold leading-7 ${text}`}>{feature.title}</dt>
                <dd className={`mt-3 max-w-sm text-base leading-7 ${textMuted}`}>
                  <p>{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`relative z-10 scroll-mt-24 border-b py-20 sm:py-24 ${border} ${sectionBg}`}>
        <div className={SHELL}>
          <div className="mx-auto max-w-2xl text-center">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>Pricing</p>
            <h2 className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-snug ${text}`}>
              Pricing that stays out of the way
            </h2>
          </div>

          <div className="mt-12 grid max-w-lg grid-cols-1 gap-6 sm:mt-14 lg:mt-16 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'One initiative, full workflow to evaluate',
                features: ['1 active project', 'Basic AI task creation', 'Weekly sprint planning'],
              },
              {
                name: 'Pro',
                price: '$6/month',
                description: 'When you’re shipping every week and outgrew ad-hoc lists',
                features: [
                  'Unlimited projects',
                  'AI task creation',
                  'Weekly sprint planning',
                  'Sprint retrospectives & delivery summaries',
                  'Advanced AI assistance',
                  'MCP server access',
                  'Priority support',
                ],
                featured: true,
              },
              {
                name: 'Enterprise',
                price: 'Contact us',
                description: 'Security, governance, and support at org scale',
                features: [
                  'Custom solutions tailored to your organization’s scale',
                  'Enhanced security and compliance capabilities',
                  'Dedicated enterprise support channels',
                  'Flexible deployment and integration options',
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col justify-between rounded-2xl border p-6 sm:p-8 ${
                  tier.featured
                    ? isDarkMode
                      ? 'border-sky-500/50 bg-zinc-900 shadow-lg shadow-black/25 ring-1 ring-sky-500/25'
                      : 'border-sky-200 bg-white shadow-md shadow-sky-500/10 ring-1 ring-sky-500/20'
                    : isDarkMode
                      ? `border ${border} bg-zinc-950/40`
                      : `border ${border} bg-zinc-50/70`
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={`text-sm font-semibold uppercase tracking-[0.12em] ${textSubtle}`}>{tier.name}</h3>
                    {tier.featured ? (
                      <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-4 text-sm leading-relaxed ${textMuted}`}>{tier.description}</p>
                  <div className="mt-6 border-t border-zinc-200/80 pt-6 dark:border-zinc-700/80">
                    {tier.name === 'Pro' ? (
                      <div>
                        <p className={`text-3xl font-bold tracking-tight sm:text-4xl ${text}`}>
                          <span className="text-zinc-400 line-through decoration-zinc-400/80">$6</span>
                          <span className="ml-1.5 text-zinc-400 line-through decoration-zinc-400/80">/mo</span>
                        </p>
                        <p className="mt-1 text-lg font-semibold text-sky-600 dark:text-sky-400">Free this month</p>
                      </div>
                    ) : (
                      <p className={`text-3xl font-bold tracking-tight sm:text-4xl ${text}`}>{tier.price}</p>
                    )}
                  </div>
                  <ul className={`mt-6 space-y-3 text-sm leading-snug ${textMuted}`} role="list">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-x-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            tier.featured ? checkAccent : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                          strokeWidth={2.5}
                          aria-hidden
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={tier.name === 'Enterprise' ? '/feedback' : '/login'}
                  onClick={tier.name !== 'Enterprise' ? onCTAClick : undefined}
                  className={`mt-8 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.featured
                      ? 'bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 focus-visible:outline-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white'
                      : isDarkMode
                        ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:outline-zinc-600'
                        : 'bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:outline-zinc-700'
                  }`}
                >
                  {tier.name === 'Enterprise' ? 'Contact us' : 'Get started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`relative z-10 border-t backdrop-blur-sm ${border} ${
          isDarkMode ? 'bg-zinc-900/90' : 'bg-white/80'
        }`}
      >
        <div className={`py-12 sm:py-14 ${SHELL}`}>
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            <div className="max-w-xl">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>Kanban AI</p>
              <p className={`mt-3 text-base leading-relaxed sm:text-lg ${textMuted}`}>
                Code and copy still live in your editor. Kanban AI is where the week gets named: what’s in the sprint,
                what you’re committing to, and what “done” looks like—whether you’re heads-down solo or coordinating a few
                people—without living in status threads.
              </p>
              <div className="mt-7">
                <Link
                  to="/login"
                  onClick={onCTAClick}
                  className="inline-flex items-center rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_16px_-4px_rgba(251,146,60,0.3)] hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950"
                >
                  Get started
                  <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-8 sm:gap-10 lg:mt-0">
              <div>
                <h3 className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>Resources</h3>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link
                      to={DOCUMENTATION_BOARD_BASE_PATH}
                      className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}>
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}>
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>Legal</h3>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link
                      to="/terms-of-service"
                      className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy-policy"
                      className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://x.com/JonWentel"
                      target="_blank"
                      rel="noreferrer"
                      className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}
                    >
                      Kanban AI · <span className="text-sky-600 dark:text-sky-400">@jonwentel</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
