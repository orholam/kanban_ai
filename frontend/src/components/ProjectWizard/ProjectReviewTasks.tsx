import React, { useEffect, useState, useRef } from 'react';
import { generateFirstWeekTasks } from '../../lib/openai';

interface ProjectReviewTasksProps {
  isDarkMode: boolean;
  projectPlan: string;
}

export default function ProjectReviewTasks({ isDarkMode, projectPlan }: ProjectReviewTasksProps) {
  const [tasks, setTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchController = useRef(false);

  useEffect(() => {
    if (fetchController.current) return;
    fetchController.current = true;

    const fetchTasks = async () => {
      try {
        const generatedTasks = await generateFirstWeekTasks(projectPlan);
        setTasks(generatedTasks);
        setLoading(false);
      } catch (error) {
        console.error('Failed to generate tasks:', error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectPlan]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        First Week Tasks
      </h2>
      
      {loading ? (
        <div className="animate-pulse">Generating tasks...</div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task, index) => (
            <li 
              key={index}
              className={`p-3 rounded ${
                isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'
              }`}
            >
              {task}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
