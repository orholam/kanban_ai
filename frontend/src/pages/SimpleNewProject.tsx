import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Loader2, Sparkles } from 'lucide-react';
import { createProject } from '../api/createProject';
import { useAuth } from '../contexts/AuthContext';
import { NewProjectPageLayout } from '../components/NewProjectPageLayout';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../types';

interface SimpleNewProjectProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

export default function SimpleNewProject({ isDarkMode, setProjects }: SimpleNewProjectProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    if (!trimmedTitle) return;

    setIsLoading(true);
    const project_id = uuidv4();
    const now = new Date().toISOString();
    const due = new Date();
    due.setDate(due.getDate() + 7);

    const newProject = {
      id: project_id,
      title: trimmedTitle,
      description: trimmedDescription || 'No description added.',
      master_plan: '',
      initial_prompt: trimmedDescription || trimmedTitle,
      keywords: '',
      projectType: 'Manual',
      num_sprints: 10,
      current_sprint: 1,
      complete: false,
      created_at: now,
      due_date: due.toISOString(),
      achievements: '',
      user_id: user.id,
      private: true,
      notes: ''
    };

    const collaborator = {
      id: uuidv4(),
      project_id,
      user_id: user.id,
      invited_at: now,
      accepted: true,
      role: 'owner'
    };

    try {
      await createProject(newProject, collaborator);
      setProjects(prev => [...prev, { ...newProject, tasks: [] }]);
      navigate(`/project/${project_id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cardBase = isDarkMode
    ? 'border-gray-700/80 bg-gray-900/80 shadow-gray-950/40'
    : 'border-gray-200/90 bg-white/90 shadow-gray-900/[0.04]';

  const inputClass = `w-full rounded-xl border px-3.5 py-2.5 text-sm transition-shadow ${
    isDarkMode
      ? 'border-gray-600 bg-gray-800/80 text-white placeholder:text-gray-500'
      : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500`;

  return (
    <NewProjectPageLayout isDarkMode={isDarkMode}>
      <header className="mb-10 text-center sm:mb-12 sm:text-left">
        <p
          className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${
            isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
          }`}
        >
          New project
        </p>
        <h1
          className={`text-3xl font-bold tracking-tight sm:text-4xl ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          How do you want to start?
        </h1>
        <p className={`mt-3 max-w-xl text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Pick a blank board or let AI draft a plan and starter tasks from your idea.
        </p>
      </header>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div
          className={`relative rounded-2xl border-2 border-indigo-500/70 p-5 shadow-lg backdrop-blur-sm ${cardBase} ring-1 ring-indigo-500/20`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                isDarkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-600'
              }`}
            >
              <LayoutGrid className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Blank board
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    isDarkMode ? 'bg-indigo-500/25 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  Selected
                </span>
              </div>
              <p className={`mt-1 text-sm leading-snug ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Empty kanban — add columns and tasks when you are ready.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="ai"
          className={`group rounded-2xl border p-5 shadow-md backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-indigo-400/50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${cardBase} ${
            isDarkMode
              ? 'border-gray-600 hover:bg-gray-800/90'
              : 'border-gray-200 hover:bg-white hover:shadow-indigo-500/10'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md`}
            >
              <Sparkles className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                AI-assisted setup
              </h2>
              <p className={`mt-1 text-sm leading-snug ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Describe your project — get a roadmap and suggested tasks.
              </p>
              <span
                className={`mt-3 inline-flex items-center text-sm font-medium ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              >
                Continue with AI
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      <section
        className={`rounded-2xl border p-6 shadow-xl backdrop-blur-md sm:p-8 ${cardBase}`}
      >
        <h2 className={`mb-1 text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Project details
        </h2>
        <p className={`mb-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Name your board — you can change everything later on the project page.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="project-title"
              className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              Title
            </label>
            <input
              id="project-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className={inputClass}
              placeholder="My side project"
              autoComplete="off"
            />
          </div>
          <div>
            <label
              htmlFor="project-description"
              className={`mb-2 block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            >
              Description <span className="font-normal opacity-70">(optional)</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className={`${inputClass} resize-y min-h-[6rem]`}
              placeholder="What are you building?"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Creating…
              </>
            ) : (
              <>
                Create blank project
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </form>
      </section>
    </NewProjectPageLayout>
  );
}
