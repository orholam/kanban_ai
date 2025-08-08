import React, { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { Task } from '../types';

interface EnhancedFiltersProps {
  tasks: Task[];
  onFilterChange: (filteredTasks: Task[]) => void;
  isDarkMode: boolean;
}

export default function EnhancedFilters({ tasks, onFilterChange, isDarkMode }: EnhancedFiltersProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const priorities = ['low', 'medium', 'high'];
  const types = ['bug', 'feature', 'scope'];
  const statuses = ['todo', 'in-progress', 'done'];

  const applyFilters = () => {
    let filtered = tasks;

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(task => task.type === typeFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Overdue filter
    if (overdueOnly) {
      filtered = filtered.filter(task => {
        const dueDate = new Date(task.due_date);
        return dueDate < new Date();
      });
    }

    onFilterChange(filtered);
  };

  const clearFilters = () => {
    setPriorityFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setOverdueOnly(false);
    onFilterChange(tasks);
  };

  React.useEffect(() => {
    applyFilters();
  }, [priorityFilter, typeFilter, statusFilter, overdueOnly]);

  const activeFiltersCount = (priorityFilter ? 1 : 0) + (typeFilter ? 1 : 0) + (statusFilter ? 1 : 0) + (overdueOnly ? 1 : 0);

  return (
    <div className={`mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Filter className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Filters
          </span>
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className={`text-xs ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Priority Dropdown */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Type Dropdown */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`appearance-none bg-white border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>

        {/* Overdue Checkbox */}
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Overdue only
          </span>
        </label>
      </div>
    </div>
  );
} 