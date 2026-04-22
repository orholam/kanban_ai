/**
 * Landing page — Variant B.
 *
 * ClickUp-inspired marketing layout with Kanban AI brand, assets, and CTAs.
 * Keep `onCTAClick` on every auth CTA so conversions stay tracked.
 */
import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../assets/kanban_ai_logo5.png'
import promocard from '../assets/main_kanban.jpg'
import sprintPlanning from '../assets/undraw_choose_card_n0x0.svg'
import taskManagement from '../assets/undraw_join_re_w1lh.svg'
import aiAssistant from '../assets/undraw_lightbulb_moment_re_ulyo.svg'
import { TrustedBy } from '../components/TrustedBy'
import { DOCUMENTATION_BOARD_BASE_PATH } from '../documentation-board-feature/integration'
import { LANDING_HERO_VERSION_TAG } from '../lib/siteMeta'

const FEATURE_PILLS = [
  'Sprints',
  'AI planning',
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

/** ~72rem — tighter marketing column (ClickUp-like), not full-bleed wide */
const SHELL = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'

export default function LandingPageVariantB({ isDarkMode, onCTAClick, toggleTheme }: Props) {
  const [activePill, setActivePill] = useState<string>('Sprints')

  const pageBg = isDarkMode ? 'bg-zinc-950' : 'bg-white'
  const text = isDarkMode ? 'text-zinc-50' : 'text-zinc-950'
  const textMuted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600'
  const textSubtle = isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
  const border = isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
  const navBg = isDarkMode ? 'bg-zinc-950/90' : 'bg-white/90'
  const promoBar = isDarkMode
    ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-900/95'
    : 'bg-[#f4f4f3] text-zinc-800 hover:bg-[#efefee]'
  const checkAccent = 'text-indigo-500'

  const navLink = isDarkMode
    ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'

  const pillIdle = isDarkMode
    ? 'border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600'
    : 'border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'

  const pillActive = isDarkMode
    ? 'border-2 border-sky-500 bg-zinc-900 text-zinc-50 shadow-sm'
    : 'border-2 border-sky-500 bg-white text-zinc-900 shadow-sm'

  return (
    <div className={`flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden ${pageBg}`}>
      {/* Top promo strip */}
      <Link
        to={DOCUMENTATION_BOARD_BASE_PATH}
        className={`flex w-full items-center justify-center gap-1 px-4 py-3 text-center text-xs font-medium sm:text-sm ${promoBar} transition-colors`}
      >
        <span className="truncate">
          AI sprint planning: from goals to a board you can run this week
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      </Link>

      {/* Primary nav — no divider under promo (reference is flush) */}
      <header className={`sticky top-0 z-20 ${navBg} backdrop-blur-xl`}>
        <div className={`flex flex-wrap items-center justify-between gap-3 py-3.5 ${SHELL}`}>
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3">
            <img src={Logo} alt="Kanban AI" className="h-9 w-auto sm:h-10" width={160} height={40} />
            <div className="min-w-0 leading-tight">
              <span className={`block text-base font-bold tracking-tight sm:text-lg ${text}`}>Kanban AI</span>
              <span className={`block max-w-[11rem] truncate text-[11px] font-medium sm:max-w-none sm:text-xs ${textMuted}`}>
                Your AI-powered project companion
              </span>
            </div>
          </Link>

          <nav
            className={`order-3 flex w-full flex-wrap items-center justify-center gap-0.5 text-sm font-medium lg:order-none lg:w-auto lg:justify-start ${textMuted}`}
            aria-label="Marketing"
          >
            <a href="#features" className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-2 ${navLink}`}>
              Product
              <NavChevron />
            </a>
            <Link
              to={DOCUMENTATION_BOARD_BASE_PATH}
              className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-2 ${navLink}`}
            >
              Docs
            </Link>
            <Link to="/blog" className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-2 ${navLink}`}>
              Learn
              <NavChevron />
            </Link>
            <a href="#pricing" className={`rounded-full px-2.5 py-2 ${navLink}`}>
              Pricing
            </a>
            <Link to="/feedback" className={`rounded-full px-2.5 py-2 ${navLink}`}>
              Contact
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to="/feedback"
              className={`hidden rounded-full px-3 py-2 text-sm font-semibold sm:inline ${textMuted} hover:underline`}
            >
              Get a demo
            </Link>
            <Link
              to="/login"
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${border} ${text} hover:bg-black/[0.03] dark:hover:bg-white/[0.06]`}
            >
              Login
            </Link>
            <Link
              to="/login"
              onClick={onCTAClick}
              className="rounded-full bg-zinc-700 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5 transition hover:bg-zinc-600 dark:bg-zinc-500 dark:text-white dark:ring-white/10 dark:hover:bg-zinc-400"
            >
              Sign up
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full p-2 transition-colors ${navLink}`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`overflow-x-clip pb-16 pt-14 lg:overflow-visible lg:pb-24 lg:pt-20 ${SHELL}`}>
        <div className="relative grid items-start gap-12 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-12">
          <div className="relative z-10 min-w-0">
            <div className="relative mb-5 inline-flex rounded-full p-[2px]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
              >
                <div className="absolute left-1/2 top-1/2 h-[max(200%,10rem)] w-[max(200%,10rem)] min-h-[12rem] min-w-[12rem] bg-[conic-gradient(from_0deg,_transparent_0deg,_rgba(196,181,253,0.35)_32deg,_rgba(167,139,250,0.95)_56deg,_rgba(236,72,153,0.85)_82deg,_transparent_108deg,_transparent_360deg)] motion-reduce:animate-none animate-cta-border-sweep-slow" />
              </div>
              <Link
                to="/blog"
                className={`relative z-10 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-white text-zinc-800'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  Sprints, backlog & AI—on one board
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums tracking-wide ${
                      isDarkMode ? 'bg-zinc-800/90 text-zinc-200 ring-1 ring-zinc-700/80' : 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/90'
                    }`}
                  >
                    {LANDING_HERO_VERSION_TAG}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            </div>
            <h1 className={`text-4xl font-bold tracking-tight sm:text-5xl lg:text-[2.75rem] lg:leading-[1.08] ${text}`}>
              Your AI-powered project companion
            </h1>
            <ul className={`mt-8 space-y-3 text-[0.9375rem] leading-snug sm:text-base sm:leading-snug ${text}`}>
              <li className="flex items-start gap-2.5">
                <Check className={`mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 sm:h-[1.125rem] sm:w-[1.125rem] ${checkAccent}`} strokeWidth={2.25} aria-hidden />
                <span className="min-w-0">
                  <strong className="font-semibold">One rhythm.</strong>{' '}
                  <span className={textMuted}>Backlog, this week’s focus, and what’s next—without another tool.</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className={`mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 sm:h-[1.125rem] sm:w-[1.125rem] ${checkAccent}`} strokeWidth={2.25} aria-hidden />
                <span className="min-w-0">
                  <strong className="font-semibold">Clear commitments.</strong>{' '}
                  <span className={textMuted}>What’s in flight for the week stays visible so scope doesn’t quietly drift.</span>
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className={`mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 sm:h-[1.125rem] sm:w-[1.125rem] ${checkAccent}`} strokeWidth={2.25} aria-hidden />
                <span className="min-w-0">
                  <strong className="font-semibold">AI for the boring parts.</strong>{' '}
                  <span className={textMuted}>Draft and reshape work from context—then ship from the board.</span>
                </span>
              </li>
            </ul>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/login"
                onClick={onCTAClick}
                className="inline-flex w-fit items-center justify-center rounded-full bg-zinc-700 px-8 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-zinc-600 dark:bg-zinc-500 dark:text-white dark:hover:bg-zinc-400"
              >
                Get started. It&apos;s FREE!
              </Link>
              <p className={`text-sm ${textSubtle}`}>Free forever. No credit card.</p>
            </div>

            <p className={`mt-12 text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>
              What people emphasize on the board
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
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

          {/* Wider than column so bleed is to the right only (left edge stays on the column gutter). */}
          <div className="relative z-0 w-full min-w-0">
            <div className="relative w-[108%] max-w-none sm:w-[114%] lg:w-[138%] xl:w-[152%]">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={promocard}
                  alt="Kanban AI board preview"
                  className="relative z-0 block h-auto w-full max-w-none"
                />
                <div
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(to bottom, rgba(9,9,11,0) 0%, rgba(9,9,11,0) 48%, rgba(9,9,11,0.45) 78%, #09090b 100%), linear-gradient(to right, rgba(9,9,11,0) 0%, rgba(9,9,11,0) 38%, rgba(9,9,11,0.28) 52%, rgba(9,9,11,0.65) 66%, rgba(9,9,11,0.92) 80%, #09090b 93%, #09090b 100%)'
                      : 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.55) 76%, #ffffff 100%), linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0.32) 52%, rgba(255,255,255,0.78) 66%, rgba(255,255,255,0.98) 80%, #ffffff 93%, #ffffff 100%)',
                  }}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className={`border-y ${border} ${isDarkMode ? 'bg-zinc-900' : 'bg-[#f4f4f3]'}`}>
        <div className={`flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center ${SHELL}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${textSubtle}`}>Trusted by builders</p>
          <TrustedBy isDarkMode={isDarkMode} trustLabel="Indie hackers, founders & small crews" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`scroll-mt-24 border-b ${border} py-20 sm:py-24 ${pageBg}`}>
        <div className={SHELL}>
          <div className="mx-auto max-w-2xl text-center">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${textSubtle}`}>
              Product · How it works
            </p>
            <h2 className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-snug ${text}`}>
              From a messy backlog to a week you can commit to
            </h2>
          </div>

          <dl className="mx-auto mt-14 grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 sm:mt-16 lg:mt-20 lg:max-w-none lg:grid-cols-3 lg:gap-y-20">
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
      <section id="pricing" className={`scroll-mt-24 border-b ${border} py-20 sm:py-24 ${pageBg}`}>
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
                      ? 'border border-sky-500/50 bg-zinc-900 shadow-lg shadow-black/25 ring-1 ring-sky-500/25'
                      : 'border border-sky-200 bg-white shadow-md shadow-sky-500/10 ring-1 ring-sky-500/20'
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
                            tier.featured ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-400 dark:text-zinc-500'
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
                  className={`mt-8 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    tier.featured
                      ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-500 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400 dark:focus-visible:outline-sky-500'
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
      <footer className={`border-t ${border} ${isDarkMode ? 'bg-zinc-900' : 'bg-[#f4f4f3]'}`}>
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
                  className="inline-flex items-center rounded-full bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-600 dark:bg-zinc-500 dark:hover:bg-zinc-400"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
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
