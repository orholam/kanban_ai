import React, { useState } from 'react';
import { Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import Logo from '../assets/kanban_ai_logo5.png';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  onSearch: (query: string) => void;
}

export default function Header({ isDarkMode, toggleTheme, onSearch }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const closeDropdown = (e: MouseEvent) => {
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
    <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4">
            <img 
              src={Logo}
              alt="Kanban AI Logo" 
              className="h-10 w-auto"
            />
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Kanban AI</span>
          </Link>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Most controls only visible when logged in */}
            {user && (
              <>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    onChange={(e) => onSearch(e.target.value)}
                    className={`w-64 pl-10 pr-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                <button className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Bell className="h-6 w-6" />
                </button>
                <button className={`p-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Settings className="h-6 w-6" />
                </button>
                
                {/* Profile dropdown section */}
                <div className="relative">
                  <div 
                    onClick={handleProfileClick}
                    className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium cursor-pointer"
                  >
                    {user.email ? user.email.substring(0, 2).toUpperCase() : 'JD'}
                  </div>
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  } ring-1 ring-black ring-opacity-5 transition-all duration-200 ${
                    isProfileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                  }`}>
                    <div className="py-1">
                      <div className={`px-4 py-2 text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <p className="font-medium">Username</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                      </div>
                      <a href="#" className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>Profile Settings</a>
                      <a href="#" className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>Preferences</a>
                      <a 
                        href="#" 
                        onClick={handleSignOut}
                        className={`block px-4 py-2 text-sm ${isDarkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'}`}
                      >
                        Sign Out
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Theme toggle always visible */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                isDarkMode ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {isDarkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
