import React from 'react';
import { Plus } from 'lucide-react'; // Ensure the correct icon is imported

interface Task {
  title: string;
  type: string;
  description: string;
}

interface WeekOneTasksProps {
  tasks: Task[];
  isDarkMode?: boolean;
}

export default function WeekOneTasks({ tasks, isDarkMode = false }: WeekOneTasksProps) {
  return (
    <div className="flex flex-col gap-4 px-6 py-4">
      {tasks.map((task, index) => (
        <div
          key={index}
          className={`
            p-4 rounded-lg shadow-md transition-transform transform hover:scale-105
            ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> {/* Icon added here */}
              <h3 className="text-lg font-semibold text-left">{task.title}</h3> {/* Ensure text-left is applied */}
            </div>
            <span className={`text-sm font-medium ${task.type === 'feature' ? 'text-indigo-500' : 'text-purple-500'}`}>
              {task.type}
            </span>
          </div>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>
        </div>
      ))}
    </div>
  );
}
