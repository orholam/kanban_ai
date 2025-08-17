import React, { useEffect, useState, useRef } from 'react';
import { generateFirstWeekTasks } from '../../lib/openai';
import WeekOneTasks from './WeekOneTasks';
import AnimatedText from '../AnimatedText';
import { Task } from '../../types';

interface ProjectReviewTasksProps {
  isDarkMode: boolean;
  projectPlan: string;
  projectType: string; // Add this field
  onComplete: (tasks: Task[]) => void;
}

export default function ProjectReviewTasks({ isDarkMode, projectPlan, projectType, onComplete }: ProjectReviewTasksProps) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchController = useRef(false);

  useEffect(() => {
    if (fetchController.current) return;
    fetchController.current = true;

    const fetchTasks = async () => {
      try {
        console.log("projectPlan");
        console.log(projectPlan);
        const data = await generateFirstWeekTasks(projectPlan, projectType);
        const args = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
        setTasks(args.tasks);
        setLoading(false);
      } catch (error) {
        console.error('Failed to generate tasks:', error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectPlan, projectType]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        First Week Tasks
      </h2>
      <AnimatedText 
        content={`This week, we’re taking the first week from the project plan and breaking it down into specific tasks.\n\nEach task will have clear objectives to ensure progress is measurable and aligned with the project goals. As you complete tasks throughout the week, move them to Done. At the end of the week, we’ll review how things are going, and if necessary, adjust the pace or modify the project plan.`}
        isDarkMode={isDarkMode}
        className="min-h-[200px] max-h-[300px] p-4 rounded-lg border border-gray-200 dark:border-gray-700"
        speed={2}
      /> 
      <br/>
      {loading ? (
        <div className={`animate-pulse ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Generating tasks...
        </div>
      ) : (
        <>
        <WeekOneTasks tasks={tasks} isDarkMode={isDarkMode} />
          <button
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
              onClick={() => onComplete(tasks)}
          >
            Create Project
          </button>
        </>
      )}
    </div>
  );
}
