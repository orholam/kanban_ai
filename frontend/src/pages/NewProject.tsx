import React from 'react';
import ProjectCreate from '../components/ProjectCreate';

interface NewProjectProps {
    isDarkMode: boolean;
}
  
export default function NewProject({ isDarkMode }: NewProjectProps) {
  return (
    <div className={`flex-1 p-6 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create Project</h1>
        </div>
      </div>
      <ProjectCreate isDarkMode={isDarkMode} />
    </div>
  );
} 