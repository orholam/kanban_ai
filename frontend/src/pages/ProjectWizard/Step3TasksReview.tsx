import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import { generateFirstWeekTasks } from '../../lib/openai';

interface Step3TasksReviewProps {
  isDarkMode: boolean;
  projectPlan: string | null;
  projectDetails: {
    name: string;
    description: string;
    keywords: string[];
  } | null;
  onNext: (tasks: string[]) => void;
  onBack: () => void;
}

export default function Step3TasksReview({ isDarkMode, projectPlan, projectDetails, onNext, onBack }: Step3TasksReviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  const fetchTasks = async () => {
    if (!projectPlan) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const taskList = await generateFirstWeekTasks(projectPlan);
      setTasks(taskList);
    } catch (err) {
      setError('Failed to generate tasks. Please try again.');
      console.error('Error generating tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectPlan]);

  const toggleTask = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (expandedTasks.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTasks(newExpanded);
  };

  const handleRegenerate = () => {
    if (projectPlan) {
      setTasks([]);
      setError(null);
      fetchTasks();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Review Generated Tasks
        </h2>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          disabled={isLoading}
        >
          Regenerate Tasks
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'border-gray-700 bg-gray-800' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => toggleTask(index)}
              >
                {expandedTasks.has(index) ? (
                  <Minus className="w-4 h-4 mr-2 text-gray-500" />
                ) : (
                  <Plus className="w-4 h-4 mr-2 text-gray-500" />
                )}
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {task}
                </span>
              </div>
              {expandedTasks.has(index) && (
                <div className="mt-4 pl-6">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Additional details and implementation notes will be shown here...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={() => onNext(tasks)}
          disabled={isLoading || tasks.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}
