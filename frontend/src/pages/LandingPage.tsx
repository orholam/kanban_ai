import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom';
import promocard from '../assets/promoscreen.jpg'

export default function LandingPage({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" />
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} h-full overflow-y-auto`}>
      {/* Hero Section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="mx-auto max-w-2xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className={`text-4xl font-bold tracking-tight sm:text-6xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Your AI-powered project companion
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
          
          <div className="mt-16 flex justify-center -mx-16 relative z-10">
            <img 
              src={promocard}
              alt="Product preview" 
              className="rounded-xl shadow-2xl w-[140%] max-w-15xl transform scale-110"
            />
          </div>
        </div>

        {/* Decorative blob */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Feature Section */}
      <div className={`py-24 sm:py-32 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className={`text-base font-semibold leading-7 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
              Ship faster
            </h2>
            <p className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Everything you need to manage your side project
            </p>
            <p className={`mt-6 text-lg leading-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Stop letting your side projects gather dust. Our AI-powered tools help you break down complex tasks, 
              stay motivated, and make consistent progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 