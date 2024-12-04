import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Inbox, Users, Layout, Calendar, List, Clock, CheckCircle, Folder, Eye } from 'lucide-react';

interface Project {
  id: string;
  title: string;
}

interface SidebarProps {
  isDarkMode: boolean;
  projects: Project[];
}

export default function Sidebar({ isDarkMode, projects }: SidebarProps) {
  const location = useLocation();
  console.log("Sidebar Received Projects");
  console.log(projects);
  return (
    <aside className={`w-64 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r h-[calc(100vh-4rem)] flex flex-col`}>
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          <Link to="#" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
            <Inbox className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            Inbox
          </Link>
          <Link to="#" className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
            <Users className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
            My Issues
          </Link>

          <div className="pt-4">
            <p className={`px-3 text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Projects
            </p>
            <div className="mt-1 space-y-1">
              {projects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === `/project/${project.id}` || 
                    (index === 0 && !projects.some(p => location.pathname === `/project/${p.id}`))
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
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
              >
                <span className="flex items-center justify-center w-5 h-5 mr-3 border rounded-full border-current">+</span>
                New Project
              </Link>
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
                <Link
                  key={name}
                  to="#"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  {name}
                </Link>
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
