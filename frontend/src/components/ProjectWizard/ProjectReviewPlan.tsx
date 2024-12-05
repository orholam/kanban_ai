import React, { useEffect, useState, useRef } from 'react';
import { generateProjectPlan } from '../../lib/openai';

interface ProjectReviewPlanProps {
  isDarkMode: boolean;
  projectData: {
    name: string;
    description: string;
    keywords: string[];
  };
  onComplete: (plan: string) => void;
}

export default function ProjectReviewPlan({ isDarkMode, projectData, onComplete }: ProjectReviewPlanProps) {
  const [plan, setPlan] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const fetchController = useRef(false);

  useEffect(() => {
    if (fetchController.current) return;
    fetchController.current = true;

    const fetchPlan = async () => {
      try {
        console.log("generating project plan");
        const generatedPlan = await generateProjectPlan(projectData);
        setPlan(generatedPlan);
        setLoading(false);
      } catch (error) {
        console.error('Failed to generate plan:', error);
        setLoading(false);
      }
    };

    fetchPlan();
  }, [projectData]);

  const handleAcceptPlan = () => {
    onComplete(plan);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Project Plan Review
      </h2>
      
      {loading ? (
        <div className="animate-pulse">Generating project plan...</div>
      ) : (
        <>
          <div className={`whitespace-pre-wrap mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {plan}
          </div>
          <button
            onClick={handleAcceptPlan}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded"
          >
            Accept Plan
          </button>
        </>
      )}
    </div>
  );
}
