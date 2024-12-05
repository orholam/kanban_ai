import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom';
import promocard from '../assets/promoscreen.jpg'
import sprintPlanning from '../assets/undraw_choose_card_n0x0.svg'
import taskManagement from '../assets/undraw_join_re_w1lh.svg'
import aiAssistant from '../assets/undraw_lightbulb_moment_re_ulyo.svg'
import { TrustedBy } from '../components/TrustedBy'



export default function LandingPage({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" />
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} h-full overflow-y-auto`}>
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-8 sm:py-16 lg:py-24">
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

          <div className="mx-auto max-w-4xl py-8 sm:py-4">
            <div className="text-center">
              <h1 className={`text-4xl font-bold tracking-tight sm:text-6xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Your <span className="font-['Yellowtail'] text-indigo-500 text-[1.15em]">AI-powered</span> project companion
              </h1>
              <p className={`mt-6 text-lg leading-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Transform your side projects from ideas to reality with AI-assisted project management. 
                Get personalized guidance, automated task breakdowns, and intelligent progress tracking.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link to="/login"
                  className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Get started
                  <ArrowRight className="ml-2 w-4 h-4 inline" />
                </Link>
                <a 
                  href="https://github.com/orholam/kanban_ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`text-sm font-semibold leading-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}
                >
                  View on GitHub <span aria-hidden="true">→</span>
                </a>
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
            <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={`py-24 sm:py-32 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className={`text-base font-semibold leading-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              What Makes Us Different
            </h2>
            <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              It's Not Just a Kanban Board — It's Your AI-Powered Project Guide
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
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
                }
              ].map((feature) => (
                <div key={feature.title} className="flex flex-col items-center text-center">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="h-48 w-auto mb-8"
                  />
                  <dt className={`text-lg font-semibold leading-7 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </dt>
                  <dd className={`mt-4 flex flex-auto flex-col text-base leading-7 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className={`py-24 sm:py-32 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={`text-base font-semibold leading-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Pricing
            </h2>
            <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose the perfect plan for your project
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
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
                className={`flex flex-col justify-between rounded-3xl p-8 ring-1 
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
                  className={`mt-8 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
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
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left side - Mission Statement */}
            <div className="max-w-xl">
              <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Side projects aren't just a hobby anymore — they're a career booster, a portfolio highlight, and, for some, a stepping stone to something bigger. Let's make yours count.
              </p>
              <div className="mt-8">
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right side - Links */}
            <div className="mt-12 grid grid-cols-2 gap-8 lg:mt-0">
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Resources</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="https://github.com/orholam/kanban_ai" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      GitHub
                    </a>
                  </li>
                  <li>
                    <Link to="/login" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      Sign In
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="#" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a href="#" className={`text-base ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
                      Terms
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 