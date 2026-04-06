import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { NewProjectPageLayout } from '../components/NewProjectPageLayout';
import ProjectDetails from '../components/ProjectWizard/ProjectDetails';
import ProjectReviewPlan from '../components/ProjectWizard/ProjectReviewPlan';
import ProjectReviewTasks from '../components/ProjectWizard/ProjectReviewTasks';
import { createProject } from '../api/createProject';
import { createTask } from '../api/createTask';
import { useAuth } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Task, Project } from '../types';
import { formatDueDateForDb } from '../lib/taskDb';
import { useNavigate } from 'react-router-dom';
import Intro from '../components/ProjectWizard/Intro';

interface ProjectData {
  name: string;
  description: string;
  keywords: string[];
  type: string;
}

interface NewProjectAiWizardProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function NewProjectAiWizard({ isDarkMode, setProjects }: NewProjectAiWizardProps) {
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
      projectType: projectData.type,
      num_sprints: 10,
      current_sprint: 1,
      complete: false,
      created_at: new Date().toISOString(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
      achievements: '',
      user_id: user.id,
      private: true,
      notes: ''
    };
    const newCollaboratorConnection = {
      id: uuidv4(),
      project_id: project_id,
      user_id: user.id,
      invited_at: new Date().toISOString(),
      accepted: true,
      role: 'owner'
    };

    try {
      await createProject(newProject, newCollaboratorConnection);
      const dueInWeek = new Date();
      dueInWeek.setDate(dueInWeek.getDate() + 7);
      const dueYmd = formatDueDateForDb(dueInWeek);

      for (const task of tasks) {
        const ts = new Date().toISOString();
        const newTask = {
          ...task,
          id: uuidv4(),
          project_id: newProject.id,
          due_date: dueYmd,
          created_at: ts,
          updated_at: ts,
          assignee_id: user.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          type: task.type,
          status: 'todo',
          sprint: 1,
        };
        await createTask(newTask);
      }
      setProjects(prevProjects => [...prevProjects, { ...newProject, tasks: [] }]);
      setIsLoading(false);
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project or tasks:', error);
      setIsLoading(false);
    }
  };

  return (
    <NewProjectPageLayout ref={containerRef} isDarkMode={isDarkMode}>
      <div className="space-y-8 pb-32">
        <Link
          to="/new-project"
          className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
            isDarkMode
              ? 'border-gray-600 bg-gray-800/60 text-gray-200 hover:border-gray-500 hover:bg-gray-800'
              : 'border-gray-200 bg-white/80 text-gray-700 shadow-sm hover:border-gray-300 hover:bg-white'
          }`}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Blank board instead
        </Link>
        <Intro isDarkMode={isDarkMode} />
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

        {projectPlan && projectData && (
          <ProjectReviewTasks
            isDarkMode={isDarkMode}
            projectPlan={projectPlan}
            projectType={projectData.type}
            onComplete={handleProjectCreate}
          />
        )}

        {isLoading && (
          <div
            className={`flex items-center justify-center gap-3 rounded-2xl border py-10 ${
              isDarkMode ? 'border-gray-700 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-white/80 text-gray-600'
            }`}
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-indigo-500" aria-hidden />
            <span className="text-sm font-medium">Creating your project…</span>
          </div>
        )}
      </div>
    </NewProjectPageLayout>
  );
}
