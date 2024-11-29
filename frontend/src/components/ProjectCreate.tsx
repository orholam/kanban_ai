import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProjectCreateProps {
  isDarkMode: boolean;
}

export default function ProjectCreate({ isDarkMode }: ProjectCreateProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement project creation API call
    console.log('Creating project:', { projectName, description });
    // Navigate back to the main board after creation
    navigate('/');
  };

  return (
    <div className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Create New Project
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="projectName" 
              className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
            >
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              required
            />
          </div>

          <div>
            <label 
              htmlFor="description" 
              className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'} mb-2`}
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 rounded-md border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300'
              } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white font-medium rounded-md
              bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 
              hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700
              transition-all duration-200 ease-in-out"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
} 