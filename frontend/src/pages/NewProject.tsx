import React, { useState, useEffect, useRef } from 'react';
import ProjectDetails from '../components/ProjectWizard/ProjectDetails';
import ProjectReviewPlan from '../components/ProjectWizard/ProjectReviewPlan';
import ProjectReviewTasks from '../components/ProjectWizard/ProjectReviewTasks';

interface ProjectData {
  name: string;
  description: string;
  keywords: string[];
}

export default function NewProject({ isDarkMode }: { isDarkMode: boolean }) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [projectPlan, setProjectPlan] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    });

    Array.from(container.children).forEach(child => {
      resizeObserver.observe(child);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [projectData, projectPlan]);

  return (
    <div 
      ref={containerRef}
      className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} h-full overflow-auto p-6 pb-40`}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <ProjectDetails 
          isDarkMode={isDarkMode} 
          onComplete={setProjectData} 
        />
        
        {projectData && (
          <ProjectReviewPlan 
            isDarkMode={isDarkMode}
            projectData={projectData}
            onComplete={setProjectPlan}
          />
        )}
        
        {projectPlan && (
          <ProjectReviewTasks 
            isDarkMode={isDarkMode}
            projectPlan={projectPlan}
          />
        )}
      </div>
    </div>
  );
}
