import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { generateProjectPlan } from '../../lib/openai';

interface Step2ReviewPlanProps {
  isDarkMode: boolean;
  projectDetails: {
    name: string;
    description: string;
    keywords: string[];
  } | null;
  onNext: (plan: string) => void;
  onBack: () => void;
}

export default function Step2ReviewPlan({ isDarkMode, projectDetails, onNext, onBack }: Step2ReviewPlanProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [projectPlan, setProjectPlan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchProjectPlan = async () => {
    if (!projectDetails) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const plan = await generateProjectPlan(projectDetails);
      setProjectPlan(plan);
    } catch (err) {
      setError('Failed to generate project plan. Please try again.');
      console.error('Error generating project plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectPlan();
  }, [projectDetails]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Review Project Plan
        </h2>
        <button
          onClick={fetchProjectPlan}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          disabled={isLoading}
        >
          Regenerate Plan
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
        <div className={`prose ${isDarkMode ? 'prose-invert' : ''} max-w-none`}>
          <div className="p-6 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
            {projectPlan.split('\n').map((line, index) => (
              <p key={index} className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {line}
              </p>
            ))}
          </div>
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
          onClick={() => onNext(projectPlan)}
          disabled={isLoading || !projectPlan}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
