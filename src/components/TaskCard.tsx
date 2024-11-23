import React from 'react';
import { Calendar, MessageSquare, Trash2 } from 'lucide-react';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isDarkMode: boolean;
}

export default function TaskCard({ task, onClick, onDeleteTask, isDarkMode }: TaskCardProps) {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const typeColors = {
    bug: 'bg-red-100 text-red-800',
    feature: 'bg-blue-100 text-blue-800',
    scope: 'bg-purple-100 text-purple-800',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.currentTarget.classList.add('opacity-50');
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-50');
      }}
      onClick={() => onClick(task)}
      className={`${
        isDarkMode ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'
      } p-4 rounded-lg shadow-sm border cursor-move hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{task.id}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {task.title}
      </h3>

      <div className="flex items-center space-x-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[task.type]}`}>
          {task.type}
        </span>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={handleDelete}
          className={`${isDarkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'} transition-colors`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
