import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createProject } from '../api/createProject';
import { useAuth } from '../contexts/AuthContext';
import { NewProjectPageLayout } from '../components/NewProjectPageLayout';
import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../types';

interface SimpleNewProjectProps {
  isDarkMode: boolean;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}

const COLUMNS = ['To do', 'In progress', 'Done'] as const;

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
      notes: '',
    };

    const collaborator = {
      id: uuidv4(),
      project_id,
      user_id: user.id,
      invited_at: now,
      accepted: true,
      role: 'owner',
    };

    try {
      await createProject(newProject, collaborator);
      setProjects((prev) => [...prev, { ...newProject, tasks: [] }]);
      navigate(`/project/${project_id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      toast.error(err instanceof Error ? err.message : 'Could not create project');
    } finally {
      setIsLoading(false);
    }
  };

  const muted = isDarkMode ? 'text-zinc-400' : 'text-zinc-600';
  const ink = isDarkMode ? 'text-zinc-50' : 'text-zinc-950';
  const fieldBorder = isDarkMode ? 'border-zinc-700' : 'border-zinc-300';
  const fieldBg = isDarkMode ? 'bg-zinc-950' : 'bg-white';
  const previewSurface = isDarkMode
    ? 'border-zinc-800 bg-zinc-900'
    : 'border-zinc-200 bg-white';
  const columnSurface = isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-50';
  const displayTitle = title.trim() || 'Untitled board';

  const inputClass = `w-full border-0 border-b bg-transparent px-0 py-3 text-base outline-none transition-colors ${fieldBorder} ${
    isDarkMode ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
  } focus:border-indigo-500`;

  return (
    <NewProjectPageLayout isDarkMode={isDarkMode}>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,1.05fr)] lg:gap-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className={`text-4xl font-semibold tracking-tight sm:text-5xl ${ink}`}>
            Blank board
          </h1>
          <p className={`mt-3 max-w-md text-base leading-relaxed ${muted}`}>
            Name it and open an empty kanban. Add columns and tasks when you are ready.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div>
              <label
                htmlFor="project-title"
                className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
              >
                Title
              </label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputClass}
                placeholder="Weekend shipping tool"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="project-description"
                className={`mb-1 block text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}
              >
                Notes <span className={`font-normal ${muted}`}>(optional)</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} min-h-[5.5rem] resize-y`}
                placeholder="What is this for?"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  'Create board'
                )}
              </button>

              <p className={`text-sm ${muted}`}>
                Want a roadmap drafted?{' '}
                <Link
                  to="ai"
                  className={`font-medium underline-offset-4 hover:underline ${
                    isDarkMode ? 'text-zinc-200' : 'text-zinc-800'
                  }`}
                >
                  AI builder
                </Link>
              </p>
            </div>
          </form>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`overflow-hidden rounded-2xl border ${previewSurface}`}
          aria-hidden
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${ink}`}>{displayTitle}</p>
              <p className={`mt-0.5 text-xs ${muted}`}>Sprint 1 · empty</p>
            </div>
            <span
              className={`shrink-0 text-[11px] font-medium ${
                isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Preview
            </span>
          </div>

          <div className={`grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-4 ${fieldBg}`}>
            {COLUMNS.map((label, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + index * 0.06, duration: 0.3 }}
                className={`min-h-[11rem] rounded-xl p-2.5 sm:min-h-[14rem] sm:p-3 ${columnSurface}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold ${muted}`}>{label}</span>
                  <span className={`text-[11px] tabular-nums ${muted}`}>0</span>
                </div>
                <div
                  className={`rounded-lg border border-dashed px-2 py-6 text-center text-[11px] leading-snug ${
                    isDarkMode
                      ? 'border-zinc-800 text-zinc-600'
                      : 'border-zinc-200 text-zinc-400'
                  }`}
                >
                  {index === 0 ? 'Tasks land here' : ' '}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </div>
    </NewProjectPageLayout>
  );
}
