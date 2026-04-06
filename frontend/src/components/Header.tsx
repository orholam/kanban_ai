import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import Logo from '../assets/kanban_ai_logo5.png';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getUserInitials, getDisplayName } from '../lib/userUtils';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function Header({ isDarkMode, toggleTheme }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const closeDropdown = () => {
    setIsProfileOpen(false);
    document.removeEventListener('click', closeDropdown);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isProfileOpen) {
      setIsProfileOpen(true);
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 0);
    } else {
      setIsProfileOpen(false);
      document.removeEventListener('click', closeDropdown);
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProfileOpen(false);
    await signOut();
  };

  return (
    <header
      className={`relative z-30 border-b backdrop-blur-xl ${
        isDarkMode
          ? 'border-zinc-800/60 bg-zinc-950/80'
          : 'border-zinc-200/70 bg-white/80'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-4">
          <img src={Logo} alt="Kanban AI Logo" className="h-9 w-auto sm:h-10" />
          <span
            className={`truncate text-lg font-bold tracking-tight sm:text-xl ${
              isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
            }`}
          >
            Kanban AI
          </span>
        </Link>

        <nav
          className={`flex min-w-0 items-center gap-0.5 sm:gap-1 ${
            isDarkMode ? 'divide-x divide-zinc-800/80' : 'divide-x divide-zinc-200/80'
          }`}
          aria-label="Main"
        >
          <div className="flex items-center pr-1.5 sm:pr-2">
            <Link
              to="/blog"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                  : 'text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900'
              }`}
            >
              Blog
            </Link>
          </div>
          <div className="flex items-center gap-1 pl-1.5 sm:gap-2 sm:pl-2">
            {!user && (
              <Link
                to="/login"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-900'
                }`}
              >
                Sign in
              </Link>
            )}
            {user && (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold text-white shadow-md ring-1 transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${
                      isDarkMode
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 ring-indigo-400/30 focus-visible:ring-offset-zinc-950'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-600 ring-indigo-300/50 focus-visible:ring-offset-white'
                    }`}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="menu"
                  >
                    {user ? getUserInitials(user) : 'U'}
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-52 origin-top-right rounded-xl shadow-lg shadow-zinc-950/10 ring-1 transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-zinc-900/95 ring-zinc-700/80 backdrop-blur-xl'
                        : 'bg-white/95 ring-zinc-200/80 backdrop-blur-xl'
                    } ${isProfileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                    role="menu"
                  >
                    <div className="py-1">
                      <div
                        className={`border-b px-4 py-3 text-sm ${
                          isDarkMode ? 'border-zinc-800/80 text-zinc-100' : 'border-zinc-200/70 text-zinc-900'
                        }`}
                      >
                        <p className="font-medium">{user ? getDisplayName(user) : 'Unknown User'}</p>
                        <p className={`mt-0.5 text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>{user.email}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-2 py-1 text-xs font-medium text-white shadow-sm ring-1 ring-white/10">
                            ✨ Pro Plan
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/account"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileOpen(false);
                          document.removeEventListener('click', closeDropdown);
                        }}
                        className={`block px-4 py-2 text-sm ${
                          isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80' : 'text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        Account
                      </Link>
                      <a
                        href="#"
                        onClick={handleSignOut}
                        className={`block px-4 py-2 text-sm ${
                          isDarkMode ? 'text-red-400 hover:bg-zinc-800/80' : 'text-red-600 hover:bg-red-50/80'
                        }`}
                      >
                        Sign Out
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-lg p-2 transition-colors ${
                isDarkMode
                  ? 'text-amber-400 hover:bg-zinc-800/80 hover:text-amber-300'
                  : 'text-zinc-500 hover:bg-zinc-100/90 hover:text-zinc-900'
              }`}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
