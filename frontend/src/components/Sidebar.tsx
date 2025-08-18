import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, Users, Layout, Calendar, List, Clock, CheckCircle, Folder, Eye, MessageSquare } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { getUserInitials, getDisplayName } from '../lib/userUtils';

interface Project {
  id: string;
  title: string;
}

interface SidebarProps {
  isDarkMode: boolean;
  projects: Project[];
  user: User | null;
}

export default function Sidebar({ isDarkMode, projects, user }: SidebarProps) {
  const location = useLocation();
  console.log("Sidebar Received Projects");
  console.log(projects);

  return (
    <aside className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r h-[calc(100vh-4rem)] flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          <Link to="/kanban" className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
            <Users className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            My Issues
          </Link>

          <Link to="/feedback" className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
            <MessageSquare className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            Feedback
          </Link>

          <div className="pt-6">
            <p className={`px-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Projects
            </p>
            <div className="mt-3 space-y-2">
              {projects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === `/project/${project.id}` || 
                    (index === 0 && location.pathname === '/kanban')
                      ? isDarkMode
                        ? 'text-white bg-gray-700'
                        : 'text-gray-900 bg-indigo-50'
                      : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {project.title}
                </Link>
              ))}
              <Link
                to="/new-project"
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
              >
                <span className="flex items-center justify-center w-5 h-5 mr-3 text-2xl">&#10022;</span>
                New Project
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            {user ? getUserInitials(user) : 'U'}
          </div>
          <div className="ml-4">
            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              {user ? getDisplayName(user) : 'Unknown User'}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email || 'No email'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
