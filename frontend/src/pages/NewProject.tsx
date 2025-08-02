import React, { useState, useEffect, useRef } from 'react';
import ProjectDetails from '../components/ProjectWizard/ProjectDetails';
import ProjectReviewPlan from '../components/ProjectWizard/ProjectReviewPlan';
import ProjectReviewTasks from '../components/ProjectWizard/ProjectReviewTasks';
import { createProject } from '../api/createProject';
import { createTask } from '../api/createTask';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Task, Project } from '../types';
import { useNavigate } from 'react-router-dom';
import Intro from '../components/ProjectWizard/Intro';

interface ProjectData {
  name: string;
  description: string;
  keywords: string[];
}

interface NewProjectProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function NewProject({ isDarkMode, setProjects }: NewProjectProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [projectPlan, setProjectPlan] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleProjectCreate = async (tasks: Task[]) => {
    if (!projectPlan || !projectData || !user) {
      console.error('Project plan is null');
      return;
    }

    setIsLoading(true);

    const project_id = uuidv4();

    const newProject = {
      id: project_id,
      title: projectData.name,
      description: projectData.description,
      master_plan: projectPlan,
      initial_prompt: projectData.description,
      keywords: projectData.keywords.join(', '),
      num_sprints: 10,
      current_sprint: 1,
      complete: false,
      created_at: new Date().toISOString(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      achievements: '',
      user_id: user.id
    }
    const newCollaboratorConnection = {
      id: uuidv4(),
      project_id: project_id,
      user_id: user.id,
      invited_at: new Date().toISOString(),
      accepted: true,
      role: 'owner'
    }

    try {
      await createProject(newProject, newCollaboratorConnection);
      for (const task of tasks) {
        console.log(task);
        const newTask = {
          ...task,
          id: uuidv4(),
          project_id: newProject.id,
          due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
          created_at: new Date().toISOString(),
          assignee_id: user.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          type: task.type,
          status: 'todo',
          sprint: 1,
        }
        await createTask(newTask);
      }
      console.log('Project and tasks created successfully');
      setProjects(prevProjects => [...prevProjects, { ...newProject, tasks: [] }]);
      setIsLoading(false);
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project or tasks:', error);
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} h-full overflow-auto p-6 pb-40`}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        <Intro />
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
            onComplete={handleProjectCreate}
          />
        )}

        {isLoading && <div className="loading-icon">Loading...</div>}
      </div>
    </div>
  );
}
