import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Step1ProjectDetails from './ProjectWizard/Step1ProjectDetails';
import Step2ReviewPlan from './ProjectWizard/Step2ReviewPlan';
import Step3TaskReview from './ProjectWizard/Step3TasksReview';

interface NewProjectProps {
  isDarkMode: boolean;
}

interface ProjectDetails {
  name: string;
  keywords: string[];
  description: string;
}

export default function NewProject({ isDarkMode }: NewProjectProps) {
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [projectPlan, setProjectPlan] = useState<string | null>(null);
  const [tasks, setTasks] = useState<string[]>([]);

  const handleStep1Complete = (details: ProjectDetails) => {
    setProjectDetails(details);
    navigate('review-plan');
  };

  const handleStep2Complete = (plan: string) => {
    setProjectPlan(plan);
    navigate('task-review');
  };

  const handleStep3Complete = (finalTasks: string[]) => {
    setTasks(finalTasks);
    // Navigate to the new project's dashboard or wherever needed
    navigate('/projects');
  };

  return (
    <div className={`flex-1 p-6 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create Project</h1>
        </div>
      </div>

      <Routes>
        <Route 
          index
          element={
            <Step1ProjectDetails 
              isDarkMode={isDarkMode} 
              onNext={handleStep1Complete}
            />
          } 
        />
        <Route 
          path="review-plan" 
          element={
            <Step2ReviewPlan
              isDarkMode={isDarkMode}
              projectDetails={projectDetails}
              onNext={handleStep2Complete}
              onBack={() => navigate(-1)}
            />
          } 
        />
        <Route 
          path="task-review" 
          element={
            <Step3TaskReview
              isDarkMode={isDarkMode}
              projectPlan={projectPlan}
              projectDetails={projectDetails}
              onNext={handleStep3Complete}
              onBack={() => navigate(-1)}
            />
          } 
        />
      </Routes>
    </div>
  );
} 