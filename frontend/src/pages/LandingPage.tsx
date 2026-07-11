import { lazy, Suspense } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom';
import promocardLight from '../assets/promocard2_light.png'
import promocardDark from '../assets/promocard2_dark.png'
import sprintPlanning from '../assets/undraw_choose_card_n0x0.svg'
import taskManagement from '../assets/undraw_join_re_w1lh.svg'
import aiAssistant from '../assets/undraw_lightbulb_moment_re_ulyo.svg'
import { McpHeroInline } from '../components/McpHeroInline'
import { TrustedBy } from '../components/TrustedBy'
import SEO from '../components/SEO'
import { DEFAULT_DESCRIPTION, DEFAULT_KEYWORDS, DEFAULT_TITLE } from '../lib/siteMeta'
import { DOCUMENTATION_BOARD_BASE_PATH } from '../documentation-board-feature/integration'
import { useLandingVariant } from '../hooks/useLandingVariant'

const LandingPageVariantB = lazy(() => import('./LandingPageVariantB'))

interface VariantProps {
  isDarkMode: boolean;
  onCTAClick: () => void;
}

/** Control variant — the original landing page. */
function LandingPageVariantA({ isDarkMode, onCTAClick }: VariantProps) {
  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} h-full overflow-x-hidden overflow-y-auto`}>
      {/* Hero Section */}
      <div className="relative isolate px-4 pt-4 sm:px-6 sm:pt-10 lg:px-8 lg:pt-14">
        <div className="mx-auto max-w-4xl py-6 sm:py-12 lg:py-24">
          <TrustedBy isDarkMode={isDarkMode} />

          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="absolute inset-0 -z-10">
            <svg className="absolute h-full w-full" aria-hidden="true">
              <defs>
                <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M.5 24V.5H24"
                    fill="none"
                    stroke={isDarkMode ? 'white' : 'black'}
                    strokeOpacity="0.05"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#grid-pattern)"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
                }}
              />
            </svg>
          </div>

          <div className="mx-auto max-w-4xl py-4 sm:py-4">
            <div className="text-center">
              <p
                className={`mb-2 text-xs font-semibold uppercase tracking-[0.18em] sm:mb-3 sm:text-sm sm:tracking-[0.2em] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
              >
                Kanban AI
              </p>
              <h1 className={`text-balance text-[1.75rem] font-bold leading-[1.12] tracking-tight sm:text-5xl sm:leading-tight lg:text-6xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your <span className="font-['Yellowtail'] text-indigo-500 text-[1.1em] sm:text-[1.15em]">AI-powered</span> project companion
              </h1>
              <p className={`mx-auto mt-4 max-w-lg text-base leading-7 sm:mt-6 sm:max-w-none sm:text-lg sm:leading-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Transform your side projects from ideas to reality with AI-assisted project management.
                Get personalized guidance, automated task breakdowns, and intelligent progress tracking.
              </p>
              <McpHeroInline isDarkMode={isDarkMode} />
              <div className="mt-8 flex flex-col items-center gap-2 sm:mt-10">
                <div className="relative inline-flex max-w-full overflow-hidden rounded-md p-[2px]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
                  >
                    <div
                      className="absolute left-1/2 top-1/2 h-[max(200%,10rem)] w-[max(200%,10rem)] min-h-[10rem] min-w-[10rem] bg-[conic-gradient(from_0deg,_transparent_0deg,_rgba(196,181,253,0.35)_32deg,_rgba(167,139,250,0.95)_56deg,_rgba(236,72,153,0.85)_82deg,_transparent_108deg,_transparent_360deg)] motion-reduce:animate-none animate-cta-border-sweep sm:min-h-[14rem] sm:min-w-[14rem]"
                    />
                  </div>
                  <Link
                    to="/login"
                    onClick={onCTAClick}
                    className="relative z-10 inline-flex w-full items-center justify-center rounded-[4px] bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-px hover:bg-indigo-600 hover:shadow-[0_12px_36px_-8px_rgba(67,56,202,0.55),0_4px_14px_-4px_rgba(15,23,42,0.12)] hover:ring-white/25 hover:brightness-[1.05] active:translate-y-0 active:shadow-sm active:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:w-auto sm:px-3.5 sm:py-2.5 sm:text-sm"
                  >
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative z-10 mx-auto mt-10 max-w-[1600px] sm:mt-16">
              <img
                src={isDarkMode ? promocardDark : promocardLight}
                alt="Product preview"
                className="w-full rounded-lg shadow-2xl transition-shadow duration-300 sm:rounded-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          {/* Decorative blob */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-16 sm:py-24 lg:py-32 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className={`text-sm font-semibold leading-7 sm:text-base ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              What Makes Us Different
            </h2>
            <p className={`mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              It's Not Just a Kanban Board — It's Your AI-Powered Project Guide
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl sm:mt-16 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  title: "Smart Sprint Planning",
                  description: "Drop your idea, preferred tech stack, and skills you want to showcase. Our AI designs a multi-week sprint to deliver your MVP — and keeps your resume in mind.",
                  image: sprintPlanning
                },
                {
                  title: "Dynamic Weekly Task Management",
                  description: "Progress checked? AI adjusts. Lagging behind? AI recalibrates. Killing it? AI scales the challenge. Every week brings new, realistic tasks based on your progress.",
                  image: taskManagement
                },
                {
                  title: "Interactive AI Assistance",
                  description: "Create tasks with AI assistance, ask detailed follow-up questions, and let AI guide you through every roadblock.",
                  image: aiAssistant
                },
                {
                  title: "Invite Teammates",
                  description: "Add editors by email on shared projects—they see the board in their sidebar and can edit tasks and comments. Public links stay read-only for visitors.",
                  image: taskManagement
                },
                {
                  title: "MCP for AI Clients",
                  description: "Connect Claude, Cursor, and other MCP-compatible tools to your boards—list projects, manage tasks, and read sprint context from your workflow.",
                  image: taskManagement
                }
              ].map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="mb-6 h-36 w-auto sm:mb-8 sm:h-48"
                  />
                  <dt className={`text-base font-semibold leading-7 sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </dt>
                  <dd className={`mt-3 flex flex-auto flex-col text-sm leading-7 sm:mt-4 sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className={`py-16 sm:py-24 lg:py-32 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-sm font-semibold leading-7 sm:text-base ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Pricing
            </h2>
            <p className={`mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose the perfect plan for your project
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-6 sm:mt-16 sm:gap-8 lg:max-w-none lg:grid-cols-3">
            {[
              {
                name: "Hobby",
                price: "Free",
                description: "Perfect for personal side projects",
                features: [
                  "1 active project",
                  "Basic AI task creation",
                  "Weekly sprint planning",
                ]
              },
              {
                name: "Pro",
                price: "$6/month",
                description: "For serious builders and learners",
                features: [
                  "Unlimited projects",
                  "AI task creation",
                  "Weekly sprint planning",
                  "Resume-building retrospect",
                  "Advanced AI assistance",
                  "MCP server access",
                  "Priority support",
                ],
                featured: true
              },
              {
                name: "Enterprise",
                price: "Contact Us",
                description: "For teams and organizations that need more",
                features: [
                  "Custom solutions tailored to your organization's scale",
                  "Enhanced security and compliance capabilities",
                  "Dedicated enterprise support channels",
                  "Flexible deployment and integration options"
                ]
              }
            ].map((tier) => (
              <div
                key={tier.name}
                className={`flex flex-col justify-between rounded-2xl p-6 ring-1 sm:rounded-3xl sm:p-8
                  ${isDarkMode
                    ? tier.featured
                      ? 'bg-gray-900 ring-indigo-500'
                      : 'bg-gray-800 ring-gray-700'
                    : tier.featured
                      ? 'bg-gray-50 ring-indigo-500'
                      : 'bg-white ring-gray-200'
                  }
                  ${tier.featured ? 'ring-2 shadow-lg' : ''}
                `}
              >
                <div>
                  <h3
                    className={`text-lg font-semibold leading-8
                      ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {tier.name}
                  </h3>
                  <p className={`mt-4 text-sm leading-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {tier.description}
                  </p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span
                      className={`text-4xl font-bold tracking-tight
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {tier.name === "Pro" ? (
                        <>
                          <span className="line-through text-gray-400">$6/month</span>
                          <span className="block text-lg text-indigo-600 mt-1">Free this month!</span>
                        </>
                      ) : tier.price}
                    </span>
                  </p>
                  <ul
                    role="list"
                    className={`mt-8 space-y-3 text-sm leading-6
                      ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  >
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <svg className="h-6 w-5 flex-none text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  to={tier.name === "Enterprise" ? "/contact" : "/login"}
                  onClick={tier.name !== "Enterprise" ? onCTAClick : undefined}
                  className={`mt-8 block w-full rounded-md px-4 py-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:py-2
                    ${tier.featured
                      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                      : isDarkMode
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                >
                  {tier.name === "Enterprise" ? "Contact Sales" : "Get started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <div className="max-w-xl">
              <p className={`text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Side projects aren't just a hobby anymore — they're a career booster, a portfolio highlight, and, for some, a stepping stone to something bigger. Let's make yours count.
              </p>
              <div className="mt-6 sm:mt-8">
                <Link
                  to="/login"
                  onClick={onCTAClick}
                  className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto sm:py-2"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-6 sm:mt-12 sm:gap-8 lg:mt-0">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Resources</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      to={DOCUMENTATION_BOARD_BASE_PATH}
                      className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>About</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      to="/terms-of-service"
                      className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy-policy"
                      className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <a href="https://x.com/JonWentel" target="_blank" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      A project by <span className="text-indigo-500">@jonwentel</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className={`mt-10 flex justify-center border-t pt-8 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <a href="https://smollaunch.com" target="_blank" rel="noopener">
              <img
                src="https://smollaunch.com/badges/featured.svg"
                alt="Kanban AI — Featured on Smol Launch"
                loading="lazy"
                width={250}
                height={60}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Entry point used by App.tsx. Assigns A/B variant and renders the correct page. */
export default function LandingPage({
  isDarkMode,
  toggleTheme,
}: {
  isDarkMode: boolean
  toggleTheme: () => void
}) {
  const { user } = useAuth()
  const { variant, isPreview, trackCTAClick } = useLandingVariant()

  // Skip redirect when ?variant=A/B is in the URL so the owner can
  // preview either variant without being bounced to the dashboard.
  if (user && !isPreview) {
    return <Navigate to="/kanban" replace />
  }

  return (
    <>
      <SEO
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        keywords={DEFAULT_KEYWORDS}
        url="https://kanbanai.dev/"
      />
      {variant === 'B' ? (
        <Suspense fallback={null}>
          <LandingPageVariantB
            isDarkMode={isDarkMode}
            onCTAClick={trackCTAClick}
            toggleTheme={toggleTheme}
          />
        </Suspense>
      ) : (
        <LandingPageVariantA isDarkMode={isDarkMode} onCTAClick={trackCTAClick} />
      )}
    </>
  )
}
