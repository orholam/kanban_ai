import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Waitlist({ isDarkMode }: { isDarkMode: boolean }) {
  const { user } = useAuth();
  const [isSignedUp, setIsSignedUp] = useState(false);

  useEffect(() => {
    // Check if user just signed up
    if (user && !isSignedUp) {
      setIsSignedUp(true);
    }
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsSignedUp(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <SEO 
        title="Join Waitlist - Kanban AI"
        description="Join the waitlist for Kanban AI and be among the first to experience AI-powered project management for your side projects."
        keywords="waitlist, kanban AI, project management, AI assistant, sign up"
        url="https://kanbanai.dev/waitlist"
      />
      <div className={`h-screen overflow-hidden flex flex-col relative ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-gray-950 dark:to-purple-950/20 pointer-events-none" />
        
        {isSignedUp ? (
          <div className={`flex-1 flex items-center justify-center px-4 py-12 overflow-y-auto relative z-10`}>
            <div className={`max-w-lg w-full text-center`}>
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                  <div className={`relative rounded-full p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                </div>
              </div>
              <h2 className={`text-4xl font-bold mb-4 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                You're on the list!
              </h2>
              <p className={`text-lg mb-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We'll notify you when Kanban AI launches. Check your email for confirmation.
              </p>
              <Link
                to="/"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
                Return to home
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden relative z-10">
            {/* Left side - Modern selling points */}
            <div className={`hidden lg:flex lg:w-1/2 flex-col px-20 py-20 overflow-y-auto ${isDarkMode ? '' : ''}`}>
              <Link 
                to="/"
                className={`inline-flex items-center mb-16 text-sm font-medium w-fit transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
              
              <div className="max-w-lg">
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                    isDarkMode 
                      ? 'bg-indigo-500/20 text-indigo-400' 
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    Early Access
                  </span>
                </div>
                <h1 className={`text-6xl font-bold mb-6 leading-[1.1] tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Join the waitlist
                </h1>
                <p className={`text-xl mb-16 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Be among the first to experience AI-powered project management for your side projects.
                </p>

                <div className="space-y-10">
                  <div className="relative">
                    <div className={`absolute -left-4 top-0 w-1 h-full rounded-full ${
                      isDarkMode ? 'bg-indigo-500/50' : 'bg-indigo-200'
                    }`} />
                    <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Early access
                    </h3>
                    <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Get first access when we launch with priority support and dedicated onboarding.
                    </p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-4 top-0 w-1 h-full rounded-full ${
                      isDarkMode ? 'bg-indigo-500/50' : 'bg-indigo-200'
                    }`} />
                    <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Exclusive perks
                    </h3>
                    <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Special benefits for early supporters including extended trials and premium features.
                    </p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-4 top-0 w-1 h-full rounded-full ${
                      isDarkMode ? 'bg-indigo-500/50' : 'bg-indigo-200'
                    }`} />
                    <h3 className={`text-xl font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Shape the product
                    </h3>
                    <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Your feedback helps us build the perfect tool for side projects. Be part of the journey.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Waitlist form */}
            <div className={`flex-1 flex flex-col px-6 lg:px-20 py-12 overflow-y-auto ${isDarkMode ? '' : ''}`}>
              <div className="max-w-md w-full mx-auto lg:mx-0 lg:ml-auto">
                {/* Mobile back button */}
                <div className="lg:hidden mb-10">
                  <Link 
                    to="/"
                    className={`inline-flex items-center text-sm font-medium transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-gray-200' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Link>
                </div>

                <div className={`rounded-2xl p-8 ${
                  isDarkMode 
                    ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-800 shadow-2xl' 
                    : 'bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl'
                }`}>
                  <div className="mb-8">
                    <h2 className={`text-3xl font-bold mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Reserve your spot
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Join the waitlist with your email or Google account
                    </p>
                  </div>

                  <Auth
                    supabaseClient={supabase}
                    appearance={{
                      theme: ThemeSupa,
                      variables: {
                        default: {
                          colors: {
                            brand: '#6366f1',
                            brandAccent: '#4f46e5',
                            inputBackground: isDarkMode ? '#111827' : '#ffffff',
                            inputBorder: isDarkMode ? '#374151' : '#e5e7eb',
                            inputText: isDarkMode ? '#ffffff' : '#111827',
                            inputPlaceholder: '#9CA3AF',
                          },
                        }
                      },
                      style: {
                        input: {
                          padding: '1rem 1.25rem',
                          borderRadius: '0.75rem',
                          width: '100%',
                          outline: 'none',
                          fontSize: '0.9375rem',
                          minHeight: '3rem',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          transition: 'all 0.2s',
                        },
                        button: {
                          borderRadius: '0.75rem',
                          width: '100%',
                          padding: '1rem 1.25rem',
                          fontSize: '0.9375rem',
                          minHeight: '3rem',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                        },
                      },
                      className: {
                        input: `${isDarkMode 
                          ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 hover:border-gray-600' 
                          : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`,
                        button: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:shadow-lg',
                      },
                    }}
                    theme={isDarkMode ? 'dark' : 'light'}
                    providers={['google']}
                    redirectTo={`${window.location.origin}/waitlist`}
                  />

                  <p className={`text-xs mt-6 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    By joining, you agree to receive launch updates. We respect your privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

