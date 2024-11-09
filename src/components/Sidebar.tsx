import React from 'react';
import { Inbox, Users, Layout, Calendar, List, Clock, CheckCircle, Folder, Eye } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-white hover:text-gray-900">
            <Inbox className="mr-3 h-5 w-5 text-gray-400" />
            Inbox
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-white hover:text-gray-900">
            <Users className="mr-3 h-5 w-5 text-gray-400" />
            My Issues
          </a>

          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </p>
            <div className="mt-1 space-y-1">
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-900 bg-indigo-50"
              >
                Email Project
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-white hover:text-gray-900"
              >
                Analytics Dashboard
              </a>
              <a
                href="#"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-white hover:text-gray-900"
              >
                Mobile App
              </a>
            </div>
          </div>

          <div className="pt-4">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-white hover:text-gray-900"
                >
                  <Icon className="mr-3 h-5 w-5 text-gray-400" />
                  {name}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
            JD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">VIO-20-002-03</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
