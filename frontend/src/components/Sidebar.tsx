import React from 'react';
import { Inbox, Users, Layout, Calendar, List, Clock, CheckCircle, Folder, Eye } from 'lucide-react';

interface SidebarProps {
  isDarkMode: boolean;
}

export default function Sidebar({ isDarkMode }: SidebarProps) {
  return (
    <aside className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r h-[calc(100vh-4rem)] flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          <a href="#" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
            <Inbox className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            Inbox
          </a>
          <a href="#" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
            <Users className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            My Issues
          </a>

          <div className="pt-4">
            <p className={`px-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Projects
            </p>
            <div className="mt-1 space-y-1">
              <a
                href="#"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-white bg-gray-700' : 'text-gray-900 bg-indigo-50'}`}
              >
                Email Project
              </a>
              <a
                href="#"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
              >
                Analytics Dashboard
              </a>
              <a
                href="#"
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
              >
                Mobile App
              </a>
            </div>
          </div>

          <div className="pt-4">
            <p className={`px-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Views
            </p>
            <div className="mt-1 space-y-1">
              {[
                { name: 'Board', icon: Layout },
                { name: 'Calendar', icon: Calendar },
                { name: 'Backlog', icon: List },
                { name: 'Current', icon: Clock },
                { name: 'Completed', icon: CheckCircle },
                { name: 'Projects', icon: Folder },
                { name: 'Views', icon: Eye },
              ].map(({ name, icon: Icon }) => (
                <a
                  key={name}
                  href="#"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  {name}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            JD
          </div>
          <div className="ml-3">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>John Doe</p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>VIO-20-002-03</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
