import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import { useParams, Link } from 'react-router-dom';
import { Plus, Eye, EyeOff, FileText, Link as LinkIcon } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import { formatDueDateForDb, mergeTaskWithDbRow, taskInsertPayload } from '../lib/taskDb';
import { toast } from 'sonner';
import { loadGuestDraft, saveGuestDraft } from '../lib/guestDraft';

const TaskModal = lazyWithRetry(() => import('../components/TaskModal'));
const CreateTaskModal = lazyWithRetry(() => import('../components/CreateTaskModal'));
const NotesEditor = lazyWithRetry(() => import('../components/NotesEditor'));
const ProjectTaskChat = lazyWithRetry(() => import('../components/ProjectTaskChat'));

const STAGGER_DELAY_MS = 100; // Delay between each card animation

const BOARD_COLUMNS = [
  { id: 'todo' as const, title: 'To do' },
  { id: 'in-progress' as const, title: 'In progress' },
  { id: 'done' as const, title: 'Done' },
] as const;

interface KanbanBoardProps {
  isDarkMode: boolean;
  projects?: Project[];
  searchQuery: string;
  setProjects?: (projects: Project[]) => void;
  guestMode?: boolean;
}

export default function KanbanBoard({
  isDarkMode,
  projects = [],
  searchQuery,
  setProjects,
  guestMode = false,
}: KanbanBoardProps) {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]); // Add explicit Task[] type
  const tasksRef = useRef<Task[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const clearAiBrandish = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const { aiBrandish: _b, ...rest } = t;
        return rest as Task;
      })
    );
  }, []);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  useEffect(() => {
    setSelectedTask((prev) => {
      if (!prev) return prev;
      const fresh = tasks.find((t) => t.id === prev.id);
      if (!fresh) return prev;
      if (
        fresh.assignee_id === prev.assignee_id &&
        fresh.created_at === prev.created_at &&
        fresh.updated_at === prev.updated_at
      ) {
        return prev;
      }
      return {
        ...prev,
        assignee_id: fresh.assignee_id,
        created_at: fresh.created_at,
        updated_at: fresh.updated_at,
      };
    });
  }, [tasks]);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isCondensed, setIsCondensed] = useState(() => {
    const saved = localStorage.getItem('kanban-condensed-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isPrivacyUpdating, setIsPrivacyUpdating] = useState(false);
  const [projectTitleDraft, setProjectTitleDraft] = useState('');
  const [projectDescDraft, setProjectDescDraft] = useState('');
  const [isSavingProjectMeta, setIsSavingProjectMeta] = useState(false);
  const prevFetchedProjectIdRef = useRef<string | null>(null);

  const handleCondensedToggle = (newValue: boolean) => {
    setIsCondensed(newValue);
    localStorage.setItem('kanban-condensed-mode', JSON.stringify(newValue));
  };


  useEffect(() => {
    if (guestMode) return;
    if (projects.length === 0) return;

    const incoming =
      projectId !== undefined ? projects.find((p) => p.id === projectId) : undefined;
    const next = incoming ?? projects[0];
    if (!next) return;

    setCurrentProject((prev) => {
      if (prev?.id === next.id) {
        return {
          ...prev,
          title: next.title,
          description: next.description,
          keywords: next.keywords,
          num_sprints: next.num_sprints,
          current_sprint: next.current_sprint,
          due_date: next.due_date,
          complete: next.complete,
          created_at: next.created_at,
          user_id: next.user_id,
          private: next.private ?? prev.private,
          projectType: next.projectType ?? prev.projectType,
        };
      }
      return next;
    });
  }, [guestMode, projectId, projects]);

  useEffect(() => {
    if (guestMode) return;
    const id = currentProject?.id;
    if (!id) return;

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('master_plan, initial_prompt, achievements, notes')
        .eq('id', id)
        .maybeSingle();

      if (cancelled || error || !data) return;
      setCurrentProject((prev) => (prev?.id !== id ? prev : { ...prev, ...data }));
    })();

    return () => {
      cancelled = true;
    };
  }, [guestMode, currentProject?.id]);

  useEffect(() => {
    if (!currentProject) return;
    setProjectTitleDraft(currentProject.title);
    setProjectDescDraft(currentProject.description ?? '');
  }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- drafts follow project id only

  useEffect(() => {
    if (!guestMode) return;
    const d = loadGuestDraft();
    setCurrentProject(d.project);
    setTasks(d.tasks);
    setIsLoading(false);
  }, [guestMode]);

  useEffect(() => {
    if (!guestMode || !currentProject) return;
    const t = window.setTimeout(() => {
      saveGuestDraft({ project: currentProject, tasks });
    }, 400);
    return () => window.clearTimeout(t);
  }, [guestMode, currentProject, tasks]);

  useEffect(() => {
    if (!currentProject?.id || guestMode) return;

    const id = currentProject.id;
    const switched = prevFetchedProjectIdRef.current !== id;
    if (switched) {
      prevFetchedProjectIdRef.current = id;
      setTasks([]);
    }

    setIsLoading(true);
    let cancelled = false;

    void (async () => {
      const { data: fetchedTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('Error fetching tasks:', error);
        setIsLoading(false);
        return;
      }

      setTasks(fetchedTasks ?? []);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentProject?.id, guestMode]);

  {/* handle status change from todo to in progress to done etc.*/}
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    if (guestMode) {
      const touched = new Date().toISOString();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus as Task['status'], updated_at: touched, isAnimated: true }
            : task
        )
      );
      return;
    }

    const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select()

    if (error) {
      console.error('Error updating task status:', error);
      toast.error(error.message || 'Could not save status');
      return;
    }

    if (data) {
      console.log(data[0]);
      setTasks(prevTasks =>
        prevTasks.map((task) =>
          task.id === data[0].id
            ? { ...mergeTaskWithDbRow(task, data[0], { bumpUpdatedAtFromClient: true }), isAnimated: true }
            : task
        )
      );
    }
  };

  {/* handle notes change */}
  const handleNotesChange = async (newNotes: string) => {
    if (guestMode) {
      setCurrentProject(prevProject =>
        prevProject ? { ...prevProject, notes: newNotes } : null
      );
      toast.success('Notes updated');
      return;
    }

    const { data, error } = await supabase
    .from('projects')
    .update({ notes: newNotes })
    .eq('id', currentProject?.id)
    .select()
    .single();
    
    if (error) {
      console.error('Error updating notes:', error);
      return;
    }
    if (data) {
      console.log(data[0]);
      setCurrentProject(prevProject => prevProject ? { ...prevProject, notes: newNotes } : null);
      toast.success('Notes updated');
    }
  };

  {/* handle sprint change */}
  const handleSprintChange = async (taskId: string, newSprint: number) => {
    if (guestMode) {
      const touched = new Date().toISOString();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, sprint: newSprint, updated_at: touched, isAnimated: true } : task
        )
      );
      toast.success('Sprint updated');
      return;
    }

    const { data, error } = await supabase
    .from('tasks')
    .update({ sprint: newSprint })
    .eq('id', taskId)
    .select()

    if (error) {
      console.error('Error updating sprint status:', error);
      toast.error(error.message || 'Could not save sprint');
      return;
    }
    if (data) {
      console.log(data[0]);
      setTasks(prevTasks =>
        prevTasks.map((task) =>
          task.id === data[0].id
            ? { ...mergeTaskWithDbRow(task, data[0], { bumpUpdatedAtFromClient: true }), isAnimated: true }
            : task
        )
      );
      toast.success('Sprint updated');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (guestMode) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success('Task deleted');
      return;
    }

    const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    toast.success('Task deleted');
  };

  const handleCreateTask = async (newTask: Task) => {
    if (guestMode) {
      setTasks(prevTasks => [...prevTasks, { ...newTask, isAnimated: true }]);
      toast.success('Task created');
      return;
    }

    try {
      console.log("trying to create new task!");
      console.log(newTask);
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskInsertPayload(newTask)])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTasks(prevTasks => [
          ...prevTasks,
          { ...mergeTaskWithDbRow(newTask, data), isAnimated: true },
        ]);
        toast.success('Task created');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleCreateTaskFromChat = async (newTask: Task) => {
    if (guestMode) {
      const next = [...tasksRef.current, { ...newTask, isAnimated: true, aiBrandish: true }];
      tasksRef.current = next;
      setTasks(next);
      toast.success('Task created');
      return;
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskInsertPayload(newTask)])
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data) {
      const merged = mergeTaskWithDbRow(newTask, data);
      const next = [...tasksRef.current, { ...merged, isAnimated: true, aiBrandish: true }];
      tasksRef.current = next;
      setTasks(next);
      toast.success('Task created');
    }
  };

  const handleTaskUpdateFromChat = async (
    taskId: string,
    patch: Partial<Pick<Task, 'title' | 'description' | 'type' | 'priority' | 'status' | 'sprint' | 'due_date'>>
  ) => {
    if (!tasksRef.current.some((t) => t.id === taskId)) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (guestMode) {
      const touched = new Date().toISOString();
      const next = tasksRef.current.map((t) =>
        t.id === taskId
          ? { ...t, ...patch, updated_at: touched, isAnimated: true, aiBrandish: true }
          : t
      );
      tasksRef.current = next;
      setTasks(next);
      toast.success('Task updated');
      return;
    }
    const { data, error } = await supabase
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    if (data) {
      const next = tasksRef.current.map((t) =>
        t.id === taskId
          ? {
              ...mergeTaskWithDbRow(t, data, { bumpUpdatedAtFromClient: true }),
              isAnimated: true,
              aiBrandish: true,
            }
          : t
      );
      tasksRef.current = next;
      setTasks(next);
      toast.success('Task updated');
    }
  };

  const handleDeleteTaskFromChat = async (taskId: string) => {
    if (!tasksRef.current.some((t) => t.id === taskId)) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (guestMode) {
      const next = tasksRef.current.filter((t) => t.id !== taskId);
      tasksRef.current = next;
      setTasks(next);
      toast.success('Task deleted');
      return;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw new Error(error.message);
    const next = tasksRef.current.filter((t) => t.id !== taskId);
    tasksRef.current = next;
    setTasks(next);
    toast.success('Task deleted');
  };

  const handleDescriptionChange = async (taskId: string, newDescription: string) => {
    if (guestMode) {
      const touched = new Date().toISOString();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, description: newDescription, updated_at: touched, isAnimated: true }
            : task
        )
      );
      toast.success('Description updated');
      return;
    }

    try {
      const { data, error } = await supabase
      .from('tasks')
      .update({ description: newDescription })
      .eq('id', taskId)
      .select()

      if (error) {
        console.error('Error updating description:', error);
        toast.error(error.message || 'Could not save description');
        return;
      }
      if (data) {
        console.log(data[0]);
        setTasks(prevTasks =>
          prevTasks.map((task) =>
            task.id === data[0].id
              ? {
                  ...mergeTaskWithDbRow(task, data[0], { bumpUpdatedAtFromClient: true }),
                  isAnimated: true,
                }
              : task
          )
        );
        toast.success('Description updated');
      }
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleTitleChange = async (taskId: string, newTitle: string) => {
    if (guestMode) {
      const touched = new Date().toISOString();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, title: newTitle, updated_at: touched, isAnimated: true } : task
        )
      );
      toast.success('Title updated');
      return;
    }

    try {
      const { data, error } = await supabase
      .from('tasks')
      .update({ title: newTitle })
      .eq('id', taskId)
      .select()

      if (error) {
        console.error('Error updating title:', error);
        toast.error(error.message || 'Could not save title');
        return;
      }
      if (data) {
        console.log(data[0]);
        setTasks(prevTasks =>
          prevTasks.map((task) =>
            task.id === data[0].id
              ? {
                  ...mergeTaskWithDbRow(task, data[0], { bumpUpdatedAtFromClient: true }),
                  isAnimated: true,
                }
              : task
          )
        );
        toast.success('Title updated');
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleDueDateChange = async (taskId: string, newDueDate: Date) => {
    if (guestMode) {
      const touched = new Date().toISOString();
      const iso = newDueDate.toISOString().split('T')[0];
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, due_date: iso, updated_at: touched, isAnimated: true } : task
        )
      );
      toast.success('Due date updated');
      return;
    }

    try {
      const { data, error } = await supabase
      .from('tasks')
      .update({ due_date: formatDueDateForDb(newDueDate) })
      .eq('id', taskId)
      .select()

      if (error) {
        console.error('Error updating due date:', error);
        toast.error(error.message || 'Could not save due date');
        return;
      }
      if (data) {
        console.log(data[0]);
        setTasks(prevTasks =>
          prevTasks.map((task) =>
            task.id === data[0].id
              ? {
                  ...mergeTaskWithDbRow(task, data[0], { bumpUpdatedAtFromClient: true }),
                  isAnimated: true,
                }
              : task
          )
        );
        toast.success('Due date updated');
      }
    } catch (error) {
      console.error('Error updating due date:', error);
    }
  };

  const persistProjectMeta = async (updates: { title?: string; description?: string }) => {
    if (!currentProject) return;

    if (guestMode) {
      setCurrentProject((prev) => (prev ? { ...prev, ...updates } : null));
      toast.success('Project updated');
      return;
    }

    try {
      setIsSavingProjectMeta(true);
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', currentProject.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        toast.error('Could not save project');
        setProjectTitleDraft(currentProject.title);
        setProjectDescDraft(currentProject.description ?? '');
        return;
      }

      if (data) {
        setCurrentProject((prev) => (prev ? { ...prev, ...data } : null));
        if (setProjects) {
          setProjects(projects.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
        }
        toast.success('Project updated');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      toast.error('Could not save project');
      setProjectTitleDraft(currentProject.title);
      setProjectDescDraft(currentProject.description ?? '');
    } finally {
      setIsSavingProjectMeta(false);
    }
  };

  const handleProjectTitleCommit = async () => {
    if (!currentProject || isSavingProjectMeta) return;
    const next = projectTitleDraft.trim();
    if (!next) {
      toast.error('Project name cannot be empty');
      setProjectTitleDraft(currentProject.title);
      return;
    }
    if (next === currentProject.title) return;
    await persistProjectMeta({ title: next });
  };

  const handleProjectDescriptionCommit = async () => {
    if (!currentProject || isSavingProjectMeta) return;
    const next = projectDescDraft.trim();
    if (next === (currentProject.description ?? '').trim()) return;
    await persistProjectMeta({ description: next });
  };

  const handlePrivacyToggle = async () => {
    if (guestMode) return;
    if (!currentProject || isPrivacyUpdating) return;
    
    try {
      setIsPrivacyUpdating(true);
      const newPrivacyStatus = !currentProject.private;
      
      // Update the project in the database
      const { data, error } = await supabase
        .from('projects')
        .update({ private: newPrivacyStatus })
        .eq('id', currentProject.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project privacy:', error);
        toast.error('Failed to update project privacy');
        return;
      }

      if (data) {
        // Update local state
        setCurrentProject(prev => prev ? { ...prev, private: newPrivacyStatus } : null);
        
        // Update projects list
        const updatedProjects = projects.map(project => 
          project.id === currentProject.id 
            ? { ...project, private: newPrivacyStatus }
            : project
        );
        
        // Update parent projects state if setProjects is available
        if (setProjects) {
          setProjects(updatedProjects);
        }
        
        // If making public, copy URL and show success toast
        if (!newPrivacyStatus) {
          const projectUrl = `${window.location.origin}/public/project/${currentProject.id}`;
          try {
            await navigator.clipboard.writeText(projectUrl);
            toast.success('Project made public! URL copied to clipboard');
          } catch {
            toast.success('Project made public!');
          }
        } else {
          toast.success('Project made private');
        }
      }
    } catch (error) {
      console.error('Error updating project privacy:', error);
      toast.error('Failed to update project privacy');
    } finally {
      setIsPrivacyUpdating(false);
    }
  };

  const handleCopyProjectLink = async () => {
    if (!currentProject) return;
    
    const projectUrl = `${window.location.origin}/public/project/${currentProject.id}`;
    try {
      await navigator.clipboard.writeText(projectUrl);
      toast.success('Project link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleColumnDragLeave = (e: React.DragEvent, columnId: string) => {
    const related = e.relatedTarget as Node | null;
    const el = e.currentTarget as HTMLElement;
    if (related && el.contains(related)) return;
    setDragOverColumn((prev) => (prev === columnId ? null : prev));
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    handleStatusChange(taskId, columnId);
    setDragOverColumn(null);
  };


  const tasksByColumn = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = (t: Task) =>
      !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);

    const out: Record<(typeof BOARD_COLUMNS)[number]['id'], Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    };
    for (const t of tasks) {
      if (t.sprint !== activeSprint || !matchesSearch(t)) continue;
      if (t.status === 'todo' || t.status === 'in-progress' || t.status === 'done') {
        out[t.status].push(t);
      }
    }
    return out;
  }, [tasks, searchQuery, activeSprint]);

  return (
    <div
      className={`flex min-h-0 w-full flex-1 transition-colors duration-200 ${
        isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'
      }`}
    >
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-4">
        <header className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {currentProject ? (
                <input
                  type="text"
                  value={projectTitleDraft}
                  onChange={(e) => setProjectTitleDraft(e.target.value)}
                  onBlur={() => void handleProjectTitleCommit()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  disabled={isSavingProjectMeta}
                  aria-label="Project name"
                  className={`min-w-[10ch] max-w-full border-0 border-b border-transparent bg-transparent py-0.5 text-lg font-semibold tracking-tight transition-colors [field-sizing:content] focus:border-indigo-500 focus:outline-none focus:ring-0 disabled:opacity-60 sm:max-w-xl sm:text-xl ${
                    isDarkMode
                      ? 'text-zinc-100 placeholder:text-zinc-600 hover:border-zinc-700'
                      : 'text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-200'
                  }`}
                />
              ) : (
                <h1
                  className={`truncate text-lg font-semibold tracking-tight sm:text-xl ${
                    isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  —
                </h1>
              )}
              {currentProject && !guestMode ? (
                <span className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrivacyToggle}
                    disabled={isPrivacyUpdating}
                    aria-label={`Make project ${currentProject.private === false ? 'private' : 'public'}`}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
                      currentProject.private === false
                        ? isDarkMode
                          ? 'border-emerald-800/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-950/70'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : isDarkMode
                          ? 'border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-200'
                          : 'border-zinc-200 bg-zinc-100/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    {isPrivacyUpdating ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                    ) : currentProject.private === false ? (
                      <Eye className="h-3 w-3 shrink-0" />
                    ) : (
                      <EyeOff className="h-3 w-3 shrink-0" />
                    )}
                    {isPrivacyUpdating ? '…' : currentProject.private === false ? 'Public' : 'Private'}
                  </button>
                  {currentProject.private === false ? (
                    <button
                      type="button"
                      onClick={() => void handleCopyProjectLink()}
                      aria-label="Copy project link"
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isDarkMode
                          ? 'border-indigo-800/50 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-950/60'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                      }`}
                    >
                      <LinkIcon className="h-3 w-3 shrink-0" />
                      Copy link
                    </button>
                  ) : null}
                </span>
              ) : null}
            </div>
            {currentProject ? (
              <textarea
                value={projectDescDraft}
                onChange={(e) => setProjectDescDraft(e.target.value)}
                onBlur={() => void handleProjectDescriptionCommit()}
                disabled={isSavingProjectMeta}
                placeholder="Add a short description…"
                rows={2}
                aria-label="Project description"
                className={`mt-1 w-full max-w-2xl resize-y border-0 border-b border-transparent bg-transparent text-xs leading-snug transition-colors focus:border-indigo-500 focus:outline-none focus:ring-0 disabled:opacity-60 sm:text-[13px] ${
                  isDarkMode
                    ? 'text-zinc-400 placeholder:text-zinc-600 hover:border-zinc-700'
                    : 'text-zinc-600 placeholder:text-zinc-400 hover:border-zinc-200'
                }`}
              />
            ) : null}
          </div>
          {guestMode && tasks.length > 0 && (
            <p className={`max-w-xl text-xs leading-snug ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
              <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-700'}>Local only</span>
              {' — '}
              <Link to="/login?next=/kanban" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                sign in
              </Link>
              {' '}
              to save changes and sync across devices. Work you do before signing in is kept and added to your account as a
              project when you log in.
            </p>
          )}
        </header>

        <div
          className={`mb-3 flex min-h-[2.5rem] flex-wrap items-center gap-x-1 gap-y-1 rounded-xl border px-1 py-1 sm:mb-4 ${
            isDarkMode
              ? 'border-zinc-800/90 bg-zinc-900/35'
              : 'border-zinc-200/70 bg-zinc-100/40'
          }`}
        >
          {currentProject ? (
            <>
              <div className="flex flex-wrap items-center gap-2 px-2 py-1">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
                >
                  Sprint
                </span>
                <div
                  role="group"
                  aria-label="Active sprint"
                  className={`inline-flex rounded-lg p-0.5 ${
                    isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-200/50'
                  }`}
                >
                  {Array.from({ length: currentProject.num_sprints }, (_, i) => i + 1).map((sprint) => {
                    const active = activeSprint === sprint;
                    return (
                      <button
                        key={sprint}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setActiveSprint(sprint)}
                        className={`min-h-[1.625rem] min-w-[1.625rem] rounded-md px-2 text-xs font-semibold tabular-nums transition-colors ${
                          active
                            ? isDarkMode
                              ? 'bg-zinc-800 text-indigo-300'
                              : 'bg-white text-indigo-800'
                            : isDarkMode
                              ? 'text-zinc-500 hover:text-zinc-300'
                              : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        {sprint}
                      </button>
                    );
                  })}
                </div>
              </div>

              <span
                className={`hidden h-5 w-px shrink-0 sm:block ${isDarkMode ? 'bg-zinc-700/80' : 'bg-zinc-300/70'}`}
                aria-hidden
              />
            </>
          ) : null}

          <div className="flex items-center gap-2 px-2 py-1">
            <span className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
              Compact
            </span>
            <button
              type="button"
              onClick={() => handleCondensedToggle(!isCondensed)}
              role="switch"
              aria-checked={isCondensed}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 ${
                isCondensed ? (isDarkMode ? 'bg-indigo-600' : 'bg-indigo-500') : isDarkMode ? 'bg-zinc-700' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`absolute top-0.5 block h-4 w-4 rounded-full bg-white transition-transform ${
                  isCondensed ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <span
            className={`hidden h-5 w-px shrink-0 sm:block ${isDarkMode ? 'bg-zinc-700/80' : 'bg-zinc-300/70'}`}
            aria-hidden
          />

          <button
            type="button"
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 opacity-80" />
            Notes
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            New task
          </button>
        </div>

        <div className="grid grid-cols-1 gap-y-5 md:grid-cols-3 md:gap-x-5 md:gap-y-0 md:items-stretch lg:gap-x-6">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = tasksByColumn[column.id];
            const count = columnTasks.length;
            const dragHere = dragOverColumn === column.id;
            return (
              <div
                key={column.id}
                data-kanban-column={column.id}
                className={`flex min-h-0 min-w-0 flex-col rounded-lg border-2 border-transparent transition-[background-color,border-color] duration-150 ${
                  dragHere
                    ? isDarkMode
                      ? 'border-indigo-500/55 bg-zinc-900/50'
                      : 'border-indigo-400/70 bg-indigo-50/40'
                    : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleColumnDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div
                  className={`sticky top-0 z-[1] flex shrink-0 items-baseline justify-between gap-2 border-b py-1.5 ${
                    isDarkMode ? 'border-zinc-800/80 bg-zinc-950' : 'border-zinc-200/60 bg-zinc-50'
                  }`}
                >
                  <h3
                    className={`text-[11px] font-semibold uppercase tracking-wide ${
                      isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                    }`}
                  >
                    {column.title}
                  </h3>
                  <span className={`text-[11px] tabular-nums ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {count}
                  </span>
                </div>
                <div
                  className={`flex min-h-0 flex-1 flex-col gap-1.5 pt-2 pb-1 ${columnTasks.length === 0 ? 'min-h-[2.5rem]' : ''}`}
                >
                  {columnTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className={`relative overflow-hidden rounded-xl ${
                          !isLoading && !task.isAnimated
                            ? 'translate-y-1 transform opacity-0 animate-[fade-in-up_.45s_ease-out_forwards]'
                            : ''
                        } ${
                          task.aiBrandish
                            ? isDarkMode
                              ? 'shadow-[0_0_0_1px_rgba(129,140,248,0.14),0_0_14px_-8px_rgba(129,140,248,0.08)]'
                              : 'shadow-[0_0_0_1px_rgba(99,102,241,0.16),0_0_12px_-8px_rgba(99,102,241,0.07)]'
                            : ''
                        }`}
                        style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
                      >
                        <TaskCard
                          task={task}
                          onClick={setSelectedTask}
                          onDeleteTask={handleDeleteTask}
                          isDarkMode={isDarkMode}
                          isCondensed={isCondensed}
                        />
                        {task.aiBrandish ? (
                          <div
                            aria-hidden
                            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]"
                          >
                            <div
                              className={`absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-transparent to-transparent animate-ai-brandish-sweep ${
                                isDarkMode ? 'via-indigo-400/[0.09]' : 'via-indigo-500/[0.11]'
                              }`}
                              onAnimationEnd={() => clearAiBrandish(task.id)}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Suspense fallback={null}>
        <ProjectTaskChat
          isDarkMode={isDarkMode}
          project={currentProject}
          tasks={tasks}
          boardLoading={isLoading}
          guestMode={guestMode}
          onCreateTask={handleCreateTaskFromChat}
          onUpdateTask={handleTaskUpdateFromChat}
          onDeleteTask={handleDeleteTaskFromChat}
        />
      </Suspense>

      {selectedTask && (
        <Suspense fallback={null}>
          <TaskModal
            task={selectedTask}
            guestMode={guestMode}
            onClose={() => setSelectedTask(null)}
            onStatusChange={handleStatusChange}
            onSprintChange={handleSprintChange}
            onDescriptionChange={handleDescriptionChange}
            onTitleChange={handleTitleChange}
            onDueDateChange={handleDueDateChange}
          />
        </Suspense>
      )}

      {isCreateModalOpen && (
        <Suspense fallback={null}>
          <CreateTaskModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreateTask={handleCreateTask}
            projectId={currentProject?.id || ''}
          />
        </Suspense>
      )}

      {isNotesOpen && (
        <Suspense fallback={null}>
          <NotesEditor
            isOpen
            onToggle={() => setIsNotesOpen(false)}
            initialNotes={currentProject?.notes}
            onNotesChange={handleNotesChange}
          />
        </Suspense>
      )}
    </div>
    
  );
}
