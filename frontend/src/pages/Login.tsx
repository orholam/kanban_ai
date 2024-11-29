import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import TypewriterText from '../components/TypeWriterText'

export default function Login({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/" />
  }

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-300' : 'bg-gray-200'}`}>
        {/* Left side */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/80 to-gray-900/80 z-10" />
            <img
            src="https://images.pexels.com/photos/3780104/pexels-photo-3780104.png?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Desert landscape"
            className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 p-12 flex flex-col h-full">
                <div className="text-3xl font-bold text-white">Kanban AI</div>
                <div className="flex flex-col justify-center flex-grow">
                    <h2 className="text-4xl font-bold mb-4 text-white">
                        Your personal<br/>
                        side project<br/>
                        <TypewriterText 
                            texts={["scrum master", "motivational coach", "co-founder"]}
                            pauseBetweenTexts={8000} 
                            typingSpeed={3}
                        />
                    </h2>
                    <div className="flex gap-2 mt-8">
                        <div className="w-8 h-2 bg-gray-500 rounded-full" />
                        <div className="w-8 h-2 bg-gray-500 rounded-full" />
                        <div className="w-8 h-2 bg-indigo-500 rounded-full" />
                    </div>
                </div>
            </div>
        </div>



      <div className={`flex-1 flex flex-col justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full p-6 rounded-lg mx-auto`}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1', // indigo-500
                    brandAccent: '#4f46e5', // indigo-600
                    inputBackground: isDarkMode ? '#374151' : '#ffffff', // gray-700 : white
                    inputBorder: isDarkMode ? '#4B5563' : '#D1D5DB', // gray-600 : gray-300
                    inputText: isDarkMode ? '#ffffff' : '#111827', // white : gray-900
                    inputPlaceholder: '#9CA3AF', // gray-400
                  },
                }
              },
              style: {
                input: {
                  padding: '0.75rem 1.25rem',
                  borderRadius: '0.5rem',
                  width: '100%',
                  outline: 'none',
                  fontSize: '1rem',
                  minHeight: '3rem',
                },
                button: {
                  borderRadius: '0.5rem',
                  width: '100%',
                  padding: '0.75rem 1.25rem',
                  fontSize: '1rem',
                  minHeight: '3rem',
                },
              },
              className: {
                input: `text-base ${isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`,
                button: 'text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              },
            }}
            theme={isDarkMode ? 'dark' : 'light'}
            providers={['google', 'github']}
            redirectTo={`${window.location.origin}/`}
          />
        </div>
      </div>
    </div>
  )
} 