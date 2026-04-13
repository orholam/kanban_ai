/**
 * Landing page — Variant B.
 *
 * Experimental variant: professional, PM-focused positioning (Cursor + delivery).
 * Keep the `onCTAClick` prop wired to every CTA that leads to /kanban so conversions are tracked correctly.
 */
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom';
import promocard from '../assets/main_kanban.jpg'
import sprintPlanning from '../assets/undraw_choose_card_n0x0.svg'
import taskManagement from '../assets/undraw_join_re_w1lh.svg'
import aiAssistant from '../assets/undraw_lightbulb_moment_re_ulyo.svg'
import { TrustedBy } from '../components/TrustedBy'
import { DOCUMENTATION_BOARD_BASE_PATH } from '../documentation-board-feature/integration'

interface Props {
  isDarkMode: boolean;
  onCTAClick: () => void;
}

export default function LandingPageVariantB({ isDarkMode, onCTAClick }: Props) {
  const blobOpacity = isDarkMode ? 'opacity-30' : 'opacity-[0.22]'
  const surfaceMuted = isDarkMode ? 'bg-gray-800' : 'bg-neutral-100'
  const surfaceCard = isDarkMode ? 'bg-gray-800' : 'bg-neutral-50'
  const borderSubtle = isDarkMode ? 'border-gray-700' : 'border-neutral-200'

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-neutral-200'} h-full overflow-y-auto`}>
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-8 sm:py-16 lg:py-24">
          <TrustedBy
            isDarkMode={isDarkMode}
            trustLabel="Trusted by product and engineering teams"
          />

          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div
              className={`relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] ${blobOpacity}`}
            />
          </div>
          {!isDarkMode && (
            <div className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-96 bg-gradient-to-b from-neutral-300/25 to-transparent" />
          )}

          <div className="absolute inset-0 -z-10">
            <svg className="absolute h-full w-full" aria-hidden="true">
              <defs>
                <pattern id="grid-pattern-b" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M.5 24V.5H24"
                    fill="none"
                    stroke={isDarkMode ? 'white' : '#0a0a0a'}
                    strokeOpacity={isDarkMode ? 0.05 : 0.07}
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="url(#grid-pattern-b)"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
                }}
              />
            </svg>
          </div>

          <div className="mx-auto max-w-4xl py-8 sm:py-4">
            <div className="text-center">
              <p
                className={`mb-3 text-sm font-semibold uppercase tracking-[0.2em] ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}
              >
                Kanban AI
              </p>
              <h1
                className={`text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}
              >
                <span className="block">
                  <span className="text-indigo-500">Lightning fast 🌩️</span> project management.
                </span>
              </h1>
              <p
                className={`mt-5 max-w-xl mx-auto text-base leading-relaxed sm:text-lg ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`}
              >
                AI-planned sprints and weekly tasks on one board—so the work matches the vibe, and delivery stays legible
                for the whole team.
              </p>
              <div className="mt-10 flex flex-col items-center gap-2">
                <div className="relative inline-flex rounded-md p-[2px]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
                  >
                    <div
                      className="absolute left-1/2 top-1/2 h-[max(200%,12rem)] w-[max(200%,12rem)] min-h-[14rem] min-w-[14rem] bg-[conic-gradient(from_0deg,_transparent_0deg,_rgba(196,181,253,0.35)_32deg,_rgba(167,139,250,0.95)_56deg,_rgba(236,72,153,0.85)_82deg,_transparent_108deg,_transparent_360deg)] motion-reduce:animate-none animate-cta-border-sweep"
                    />
                  </div>
                  <Link
                    to="/kanban"
                    onClick={onCTAClick}
                    className="relative z-10 inline-flex items-center rounded-[4px] bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-white/10 transition-all duration-200 ease-out hover:-translate-y-px hover:bg-indigo-600 hover:shadow-[0_12px_36px_-8px_rgba(67,56,202,0.55),0_4px_14px_-4px_rgba(15,23,42,0.12)] hover:ring-white/25 hover:brightness-[1.05] active:translate-y-0 active:shadow-sm active:brightness-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    Open workspace — no signup
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-16 flex justify-center relative z-10 mx-2 sm:mx-8">
              <img
                src={promocard}
                alt="Product preview"
                className="rounded-xl shadow-2xl w-full max-w-[1600px] transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              />
            </div>
          </div>

          {/* Decorative blob */}
          <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div
              className={`relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] ${blobOpacity}`}
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div
        className={`py-24 sm:py-32 border-y ${borderSubtle} ${surfaceMuted}`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className={`text-base font-semibold leading-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
              Velocity without chaos
            </h2>
            <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}>
              Project management that matches real engineering cadence
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  title: "Sprint planning that stays honest",
                  description:
                    "Turn goals and constraints into a phased plan the team can execute. AI proposes milestones and scope so you spend less time estimating and more time delivering.",
                  image: sprintPlanning
                },
                {
                  title: "Weekly throughput you can steer",
                  description:
                    "See what landed, what slipped, and what to pull forward. AI adjusts the next week’s load so velocity stays realistic as priorities shift.",
                  image: taskManagement
                },
                {
                  title: "AI that unblocks execution",
                  description:
                    "Draft and refine work items with context, ask follow-ups in plain language, and clear ambiguity before it becomes a delay.",
                  image: aiAssistant
                }
              ].map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-48 w-auto mb-8"
                  />
                  <dt className={`text-lg font-semibold leading-7 ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}>
                    {feature.title}
                  </dt>
                  <dd className={`mt-4 flex flex-auto flex-col text-base leading-7 ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className={`py-24 sm:py-32 ${surfaceCard}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-base font-semibold leading-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>
              Pricing
            </h2>
            <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}>
              Plans that scale with your delivery cadence
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "Free",
                description: "One initiative, full workflow to evaluate",
                features: [
                  "1 active project",
                  "Basic AI task creation",
                  "Weekly sprint planning",
                ]
              },
              {
                name: "Pro",
                price: "$6/month",
                description: "For leads and teams shipping every week",
                features: [
                  "Unlimited projects",
                  "AI task creation",
                  "Weekly sprint planning",
                  "Sprint retrospectives & delivery summaries",
                  "Advanced AI assistance",
                  "Priority support",
                ],
                featured: true
              },
              {
                name: "Enterprise",
                price: "Contact Us",
                description: "Security, governance, and support at org scale",
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
                className={`flex flex-col justify-between rounded-3xl p-8 ring-1
                  ${isDarkMode
                    ? tier.featured
                      ? 'bg-gray-950 ring-indigo-500'
                      : 'bg-gray-800 ring-gray-700'
                    : tier.featured
                      ? 'bg-neutral-100 ring-indigo-600'
                      : 'bg-white ring-neutral-300'
                  }
                  ${tier.featured ? 'ring-2 shadow-lg' : ''}
                `}
              >
                <div>
                  <h3
                    className={`text-lg font-semibold leading-8
                      ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}
                  >
                    {tier.name}
                  </h3>
                  <p className={`mt-4 text-sm leading-6 ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {tier.description}
                  </p>
                  <p className="mt-6 flex items-baseline gap-x-1">
                    <span
                      className={`text-4xl font-bold tracking-tight
                        ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}
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
                      ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}
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
                  to={tier.name === "Enterprise" ? "/contact" : "/kanban"}
                  onClick={tier.name !== "Enterprise" ? onCTAClick : undefined}
                  className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                    ${tier.featured
                      ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600'
                      : isDarkMode
                        ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    }`}
                >
                  {tier.name === "Enterprise" ? "Contact Sales" : "Try now"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-neutral-300 bg-neutral-100'}`}>
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <div className="max-w-xl">
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Execution lives in the editor; planning and reporting need a home. Kanban AI ties Cursor-speed iteration to
                your board—scope, owners, and weekly delivery in one place for product and engineering leads.
              </p>
              <div className="mt-8">
                <Link
                  to="/kanban"
                  onClick={onCTAClick}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Open workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8 lg:mt-0">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}>Resources</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      to={DOCUMENTATION_BOARD_BASE_PATH}
                      className={`text-base ${isDarkMode ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'}`}
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/blog" className={`text-base ${isDarkMode ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'}`}>
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className={`text-base ${isDarkMode ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'}`}>
                      Sign in
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-neutral-950'}`}>About</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link
                      to="/terms-of-service"
                      className={`text-base ${isDarkMode ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'}`}
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/privacy-policy"
                      className={`text-base ${isDarkMode ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'}`}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <a href="https://x.com/JonWentel" target="_blank" className={`text-base ${isDarkMode ? 'text-neutral-300 hover:text-white' : 'text-neutral-700 hover:text-neutral-950'}`}>
                      Kanban AI · <span className="text-indigo-500">@jonwentel</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
