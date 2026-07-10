/**
 * Landing page — Variant B.
 *
 * Premium B2B SaaS layout (iridescent hero, centered copy, floating product card).
 * Keep `onCTAClick` on every auth CTA so conversions stay tracked.
 */
import { useState, type ReactNode } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clipboard,
  Github,
  Menu,
  Moon,
  Plug,
  Sun,
  Terminal,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../assets/kanban_ai_logo5.png'
import promocardLight from '../assets/promocard2_light.png'
import promocardDark from '../assets/promocard2_dark.png'
import sprintPlanning from '../assets/undraw_choose_card_n0x0.svg'
import taskManagement from '../assets/undraw_join_re_w1lh.svg'
import aiAssistant from '../assets/undraw_lightbulb_moment_re_ulyo.svg'
import { McpHeroInline } from '../components/McpHeroInline'
import { TrustedBy } from '../components/TrustedBy'
import { DOCUMENTATION_BOARD_BASE_PATH, documentationBoardArticlePath } from '../documentation-board-feature/integration'
import { MCP_DOCS_SLUG } from '../lib/mcpSetup'
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

/** Iridescent mesh + ASCII code rain — Fonla-style light hero. */
function HeroAtmosphere({ isDarkMode }: Pick<Props, 'isDarkMode'>) {
  const asciiPattern = `url("data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'>
      <text x='8' y='24' font-family='ui-monospace,monospace' font-size='12' fill='%23000' opacity='0.9'>0101</text>
      <text x='120' y='18' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.7'>+</text>
      <text x='200' y='42' font-family='ui-monospace,monospace' font-size='10' fill='%23000' opacity='0.8'>ctx</text>
      <text x='300' y='28' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.65'>1010</text>
      <text x='40' y='72' font-family='ui-monospace,monospace' font-size='9' fill='%23000' opacity='0.55'>x</text>
      <text x='160' y='88' font-family='ui-monospace,monospace' font-size='12' fill='%23000' opacity='0.75'>MCP</text>
      <text x='260' y='76' font-family='ui-monospace,monospace' font-size='10' fill='%23000' opacity='0.6'>ai</text>
      <text x='12' y='130' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.7'>+</text>
      <text x='100' y='148' font-family='ui-monospace,monospace' font-size='10' fill='%23000' opacity='0.55'>0x</text>
      <text x='220' y='132' font-family='ui-monospace,monospace' font-size='12' fill='%23000' opacity='0.8'>sprint</text>
      <text x='310' y='156' font-family='ui-monospace,monospace' font-size='9' fill='%23000' opacity='0.5'>*</text>
      <text x='56' y='200' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.65'>1101</text>
      <text x='180' y='212' font-family='ui-monospace,monospace' font-size='10' fill='%23000' opacity='0.7'>+</text>
      <text x='280' y='196' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.75'>board</text>
      <text x='24' y='268' font-family='ui-monospace,monospace' font-size='10' fill='%23000' opacity='0.55'>01</text>
      <text x='140' y='280' font-family='ui-monospace,monospace' font-size='12' fill='%23000' opacity='0.8'>task</text>
      <text x='240' y='260' font-family='ui-monospace,monospace' font-size='9' fill='%23000' opacity='0.6'>+</text>
      <text x='320' y='292' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.7'>1010</text>
      <text x='80' y='330' font-family='ui-monospace,monospace' font-size='10' fill='%23000' opacity='0.5'>ctx</text>
      <text x='200' y='340' font-family='ui-monospace,monospace' font-size='11' fill='%23000' opacity='0.65'>ai</text>
    </svg>
  `)}")`

  if (isDarkMode) {
    return (
      <>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-zinc-950" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 75% 55% at 50% 8%, rgba(186,230,253,0.22) 0%, transparent 58%),
              radial-gradient(ellipse 55% 45% at 82% 12%, rgba(253,186,216,0.18) 0%, transparent 52%),
              radial-gradient(ellipse 50% 40% at 18% 55%, rgba(167,243,208,0.14) 0%, transparent 50%),
              radial-gradient(ellipse 45% 40% at 55% 70%, rgba(254,240,138,0.12) 0%, transparent 48%)
            `,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: asciiPattern,
            maskImage: 'radial-gradient(ellipse 95% 85% at 50% 30%, black 20%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 50% 30%, black 20%, transparent 78%)',
          }}
        />
      </>
    )
  }

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#f6f5fa]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 85% 65% at 50% 0%, rgba(186,230,253,0.75) 0%, transparent 58%),
            radial-gradient(ellipse 70% 55% at 88% 8%, rgba(253,186,216,0.65) 0%, transparent 52%),
            radial-gradient(ellipse 65% 50% at 12% 45%, rgba(167,243,208,0.55) 0%, transparent 50%),
            radial-gradient(ellipse 60% 50% at 72% 68%, rgba(254,240,138,0.5) 0%, transparent 48%),
            radial-gradient(ellipse 55% 45% at 38% 72%, rgba(196,181,253,0.45) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 35%, rgba(255,255,255,0.9) 0%, transparent 55%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: asciiPattern,
          maskImage: 'radial-gradient(ellipse 100% 90% at 50% 28%, black 25%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 90% at 50% 28%, black 25%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.35) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 100% 85% at 50% 35%, black 15%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 85% at 50% 35%, black 15%, transparent 78%)',
        }}
      />
    </>
  )
}

function GradientCtaButton({
  to,
  onClick,
  children,
  isDarkMode,
}: {
  to: string
  onClick?: () => void
  children: ReactNode
  isDarkMode: boolean
}) {
  return (
    <div
      className={`flex w-full max-w-sm sm:inline-flex sm:w-auto sm:max-w-none rounded-xl p-[1.5px] shadow-[0_4px_32px_-8px_rgba(56,189,248,0.35),0_8px_24px_-12px_rgba(251,146,60,0.25)] ${
        isDarkMode
          ? 'bg-gradient-to-r from-sky-400/70 via-violet-400/60 to-amber-300/50'
          : 'bg-gradient-to-r from-sky-300 via-pink-300 via-40% to-amber-200'
      }`}
    >
      <Link
        to={to}
        onClick={onClick}
        className={`group inline-flex w-full items-center justify-center rounded-[10px] px-6 py-3.5 text-[15px] font-semibold transition sm:w-auto sm:px-7 ${
          isDarkMode
            ? 'bg-zinc-950 text-white hover:bg-zinc-900'
            : 'bg-zinc-950 text-white hover:bg-zinc-800'
        }`}
      >
        {children}
        <ArrowUpRight
          className="ml-1.5 h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </Link>
    </div>
  )
}

export default function LandingPageVariantB({ isDarkMode, onCTAClick, toggleTheme }: Props) {
  const [activePill, setActivePill] = useState<string>('Sprints')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const mobileNavLink = `block rounded-xl px-4 py-3 text-base font-medium ${navLink}`

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden">
      <HeroAtmosphere isDarkMode={isDarkMode} />

      {/* Floating pill nav — Fonla-style */}
      <header className="sticky top-0 z-30 flex flex-col items-center px-3 pb-2 pt-3 sm:px-4 sm:pt-5 sm:pb-2">
        <div
          className={`flex w-full max-w-3xl items-center justify-between gap-2 rounded-full border px-3 py-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:gap-4 sm:px-5 ${
            isDarkMode
              ? 'border-zinc-700/50 bg-zinc-900/70'
              : 'border-white/80 bg-white/65'
          }`}
        >
          <Link to="/" className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
            <img src={Logo} alt="Kanban AI" className="h-6 w-auto sm:h-7" width={128} height={32} />
            <span className={`hidden min-[400px]:inline text-sm font-bold tracking-tight ${text}`}>Kanban AI</span>
          </Link>

          <nav
            className={`hidden items-center gap-1 text-[13px] font-medium sm:flex ${textMuted}`}
            aria-label="Marketing"
          >
            <a href="#features" className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 ${navLink}`}>
              Features
              <NavChevron />
            </a>
            <a href="#features" className={`rounded-full px-2.5 py-1 ${navLink}`}>
              Product
            </a>
            <Link to={DOCUMENTATION_BOARD_BASE_PATH} className={`rounded-full px-2.5 py-1 ${navLink}`}>
              Docs
            </Link>
            <a href="#pricing" className={`rounded-full px-2.5 py-1 ${navLink}`}>
              Pricing
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full p-1.5 transition-colors sm:mr-1 ${navLink}`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/login"
              onClick={onCTAClick}
              className="hidden rounded-full bg-zinc-950 px-3.5 py-1.5 text-[13px] font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 sm:inline-flex"
            >
              Sign up
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className={`rounded-full p-1.5 transition-colors sm:hidden ${navLink}`}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav
            id="landing-mobile-menu"
            className={`mt-2 w-full max-w-3xl rounded-2xl border p-2 shadow-lg backdrop-blur-xl sm:hidden ${
              isDarkMode
                ? 'border-zinc-700/50 bg-zinc-900/95'
                : 'border-white/80 bg-white/90'
            }`}
            aria-label="Mobile marketing"
          >
            <a href="#features" onClick={closeMobileMenu} className={mobileNavLink}>
              Features
            </a>
            <a href="#features" onClick={closeMobileMenu} className={mobileNavLink}>
              Product
            </a>
            <Link to={DOCUMENTATION_BOARD_BASE_PATH} onClick={closeMobileMenu} className={mobileNavLink}>
              Docs
            </Link>
            <a href="#pricing" onClick={closeMobileMenu} className={mobileNavLink}>
              Pricing
            </a>
            <Link
              to="/login"
              onClick={() => {
                closeMobileMenu()
                onCTAClick()
              }}
              className="mt-1 block rounded-xl bg-zinc-950 px-4 py-3 text-center text-base font-semibold text-white dark:bg-zinc-100 dark:text-zinc-950"
            >
              Sign up free
            </Link>
          </nav>
        ) : null}
      </header>

      {/* Hero — minimal centered stack like Fonla */}
      <section className={`relative z-10 pb-4 pt-6 sm:pb-6 sm:pt-14 lg:pt-16 ${SHELL}`}>
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className={`text-balance text-[1.65rem] font-bold leading-[1.1] tracking-tight sm:text-[2.75rem] sm:leading-[1.06] lg:text-[3.5rem] ${text}`}
          >
            Enterprise-grade sprint planning powered by AI
          </h1>
          <p className={`mx-auto mt-3 max-w-lg text-[15px] leading-relaxed sm:mt-5 sm:text-lg ${textMuted}`}>
            Kanban AI is an AI-powered project platform that turns messy backlogs into weekly boards you can commit to.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row sm:gap-4">
            <GradientCtaButton to="/login" onClick={onCTAClick} isDarkMode={isDarkMode}>
              Get started free
            </GradientCtaButton>
            <a
              href="https://github.com/orholam/kanban_ai"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isDarkMode
                  ? 'text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800/80 hover:text-white'
                  : 'text-zinc-700 ring-1 ring-zinc-300/90 hover:bg-white hover:text-zinc-900'
              }`}
            >
              <Github className="h-4 w-4" aria-hidden />
              Open source
            </a>
          </div>
        </div>

        {/* Product mockup — large, floating over the glow */}
        <div className="relative mx-auto mt-6 max-w-6xl sm:mt-10 lg:mt-12">
          <div
            className={`overflow-hidden rounded-xl border p-0.5 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.2),0_8px_32px_-12px_rgba(0,0,0,0.1)] sm:rounded-[1.25rem] sm:p-1.5 sm:shadow-[0_32px_100px_-24px_rgba(0,0,0,0.22),0_12px_40px_-16px_rgba(0,0,0,0.1)] ${
              isDarkMode
                ? 'border-zinc-700/50 bg-zinc-900/95'
                : 'border-white bg-white/90 backdrop-blur-sm'
            }`}
          >
            <img
              src={isDarkMode ? promocardDark : promocardLight}
              alt="Kanban AI board preview"
              className="block h-auto w-full rounded-[10px] sm:rounded-2xl"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl text-center sm:mt-12">
          <McpHeroInline isDarkMode={isDarkMode} />
        </div>

        <div className="mx-auto mt-6 max-w-3xl text-center sm:mt-10">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>
            What people emphasize on the board
          </p>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
            {FEATURE_PILLS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setActivePill(label)}
                className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-3.5 sm:text-sm ${label === activePill ? pillActive : pillIdle}`}
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
        <div className={`flex flex-col items-center justify-center gap-4 px-2 py-8 text-center sm:flex-row sm:justify-between sm:gap-6 sm:py-10 sm:text-left ${SHELL}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${textSubtle}`}>Trusted by builders</p>
          <TrustedBy isDarkMode={isDarkMode} trustLabel="Indie hackers, founders & small crews" />
        </div>
      </section>

      {/* MCP deep-dive */}
      <section
        className={`relative z-10 scroll-mt-24 py-12 sm:py-20 ${sectionMuted} backdrop-blur-sm`}
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

          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center">
            <Link
              to="/login"
              onClick={onCTAClick}
              className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_2px_16px_-4px_rgba(56,189,248,0.3)] hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 sm:w-auto sm:py-2.5"
            >
              Sign in to connect
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
            <Link
              to={documentationBoardArticlePath(MCP_DOCS_SLUG)}
              className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold sm:w-auto sm:py-2.5 ${
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
        className={`relative z-10 scroll-mt-24 border-b py-14 sm:py-24 ${border} ${sectionBg}`}
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

          <dl className="mx-auto mt-10 grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 sm:mt-16 sm:grid-cols-2 sm:gap-y-16 lg:mt-20 lg:max-w-none lg:grid-cols-3 lg:gap-y-20">
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
                title: 'Invite teammates',
                description:
                  'Project owners add editors by email—shared boards show up in their sidebar with full edit access. Public view links stay read-only.',
                image: taskManagement,
              },
              {
                title: 'MCP for Claude, Cursor, and more',
                description:
                  'Wire Kanban AI into MCP-compatible clients—list projects, manage tasks, and read board context from your editor or agent workflow.',
                image: taskManagement,
              },
            ].map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center">
                <img src={feature.image} alt="" className="mb-6 h-36 w-auto sm:mb-8 sm:h-44 lg:h-48" />
                <dt className={`text-base font-semibold leading-7 sm:text-lg ${text}`}>{feature.title}</dt>
                <dd className={`mt-2 max-w-sm text-sm leading-7 sm:mt-3 sm:text-base ${textMuted}`}>
                  <p>{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={`relative z-10 scroll-mt-24 border-b py-14 sm:py-24 ${border} ${sectionBg}`}>
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
                  to={tier.name === 'Enterprise' ? '/contact' : '/login'}
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
        <div className={`py-10 sm:py-14 ${SHELL}`}>
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            <div className="max-w-xl">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>Kanban AI</p>
              <p className={`mt-3 text-[15px] leading-relaxed sm:text-lg ${textMuted}`}>
                Code and copy still live in your editor. Kanban AI is where the week gets named: what’s in the sprint,
                what you’re committing to, and what “done” looks like—whether you’re heads-down solo or coordinating a few
                people—without living in status threads.
              </p>
              <div className="mt-6 sm:mt-7">
                <Link
                  to="/login"
                  onClick={onCTAClick}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_2px_16px_-4px_rgba(251,146,60,0.3)] hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 sm:w-auto sm:py-2.5"
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
                    <Link to="/contact" className={`text-sm font-medium ${textMuted} transition hover:text-zinc-900 dark:hover:text-zinc-100`}>
                      Contact
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
