import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Plus, Minus, Eye, EyeOff, Link as LinkIcon, Plug, Users, X, Filter, Sparkles } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import type { Project, Task, Priority, TaskType } from '../types';
import {
  deleteTaskRow,
  fetchProjectMetaFields,
  fetchTasksForProject,
  insertTaskRow,
  updateProjectRow,
  updateTaskRow,
  updateTaskRowReturnArray,
} from '../lib/boardDb';
import { formatDueDateForDb } from '../lib/taskDb';
import { toast } from 'sonner';
import { loadGuestDraft, saveGuestDraft } from '../lib/guestDraft';
import { isLocalAppMode } from '../lib/localApp';
import { useAuth } from '../contexts/AuthContext';
import ProjectMembersPanel from '../components/ProjectMembersPanel';
import { listProjectCollaborators } from '../api/projectCollaborators';
import { fetchProfileDisplayName } from '../lib/profileDisplayName';
import { getDisplayName, getUserInitials } from '../lib/userUtils';
import type { AssigneeOption } from '../lib/assignee';
import { initialsFromName } from '../lib/assignee';

const MCP_CONNECT_BANNER_KEY = 'kanban_mcp_connect_banner_dismissed_v1';

const TaskModal = lazyWithRetry(() => import('../components/TaskModal'));
const CreateTaskModal = lazyWithRetry(() => import('../components/CreateTaskModal'));
const ProjectTaskChat = lazyWithRetry(() => import('../components/ProjectTaskChat'));

const STAGGER_DELAY_MS = 100; // Delay between each card animation

function sprintStorageKey(projectId: string): string {
  return `kanban_active_sprint_${projectId}`;
}

function readStoredSprint(projectId: string): number | null {
  try {
    const raw = localStorage.getItem(sprintStorageKey(projectId));
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeStoredSprint(projectId: string, sprint: number): void {
  try {
    localStorage.setItem(sprintStorageKey(projectId), String(sprint));
  } catch {
    // ignore quota / private mode
  }
}

function clampSprint(sprint: number, maxSprints: number): number {
  const max = Math.max(1, maxSprints);
  if (!Number.isFinite(sprint)) return 1;
  return Math.min(Math.max(1, Math.floor(sprint)), max);
}

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
  onRefreshProjects?: () => void | Promise<void>;
}

export default function KanbanBoard({
  isDarkMode,
  projects = [],
  searchQuery,
  setProjects,
  guestMode = false,
  onRefreshProjects,
}: KanbanBoardProps) {
  const { user } = useAuth();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sprintParam = searchParams.get('sprint');
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
  const [showMcpBanner, setShowMcpBanner] = useState(false);

  useEffect(() => {
    if (guestMode || isLocalAppMode()) {
      setShowMcpBanner(false);
      return;
    }
    try {
      setShowMcpBanner(localStorage.getItem(MCP_CONNECT_BANNER_KEY) !== '1');
    } catch {
      setShowMcpBanner(true);
    }
  }, [guestMode]);

  const dismissMcpBanner = useCallback(() => {
    setShowMcpBanner(false);
    try {
      localStorage.setItem(MCP_CONNECT_BANNER_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setSelectedTask((prev) => {
      if (!prev) return prev;
      const fresh = tasks.find((t) => t.id === prev.id);
      if (!fresh) return prev;
      if (
        fresh.assignee_id === prev.assignee_id &&
        fresh.created_at === prev.created_at &&
        fresh.updated_at === prev.updated_at &&
        fresh.status === prev.status &&
        fresh.sprint === prev.sprint
      ) {
        return prev;
      }
      return {
        ...prev,
        status: fresh.status,
        sprint: fresh.sprint,
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
  const [chatOpenRequest, setChatOpenRequest] = useState(0);
  const [isCondensed, setIsCondensed] = useState(() => {
    const saved = localStorage.getItem('kanban-condensed-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isPrivacyUpdating, setIsPrivacyUpdating] = useState(false);
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | TaskType>('');
  const [priorityFilter, setPriorityFilter] = useState<'' | Priority>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);
  const [isSprintUpdating, setIsSprintUpdating] = useState(false);
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
      const data = await fetchProjectMetaFields(id);
      if (cancelled || !data) return;
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
    setAssigneeFilter('');
    setTypeFilter('');
    setPriorityFilter('');
  }, [currentProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- drafts and filters follow project id only

  useEffect(() => {
    if (!currentProject) return;
    const max = Math.max(1, currentProject.num_sprints ?? 10);
    const fromUrl = sprintParam ? parseInt(sprintParam, 10) : NaN;
    const hasValidUrl = Number.isFinite(fromUrl) && fromUrl >= 1 && fromUrl <= max;
    // The team's shared active sprint (`current_sprint`) is only the default
    // landing spot. Which sprint *this user* is viewing is per-user: URL first,
    // then their last-viewed (localStorage), then the team default.
    const teamActive = clampSprint(Number(currentProject.current_sprint ?? 1), max);
    const stored = readStoredSprint(currentProject.id);
    const fromStorage =
      stored !== null && stored >= 1 && stored <= max ? stored : null;

    const resolved = clampSprint(
      hasValidUrl ? fromUrl : (fromStorage ?? teamActive),
      max
    );

    setActiveSprint((prev) => (prev === resolved ? prev : resolved));

    if (!hasValidUrl || sprintParam !== String(resolved)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('sprint', String(resolved));
          return next;
        },
        { replace: true }
      );
    }
  }, [
    currentProject?.id,
    currentProject?.current_sprint,
    currentProject?.num_sprints,
    sprintParam,
    setSearchParams,
  ]);

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
      try {
        const fetchedTasks = await fetchTasksForProject(id);
        if (cancelled) return;
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        if (!cancelled) setIsLoading(false);
        return;
      }
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentProject?.id, guestMode]);

  useEffect(() => {
    const ownerId = currentProject?.user_id;
    const projectId = currentProject?.id;
    if (!projectId) {
      setAssigneeOptions([]);
      return;
    }

    if (guestMode) {
      setAssigneeOptions(
        user
          ? [{ id: user.id, name: getDisplayName(user), initials: getUserInitials(user) }]
          : []
      );
      return;
    }

    let cancelled = false;
    void (async () => {
      const options: AssigneeOption[] = [];
      const seen = new Set<string>();

      if (ownerId) {
        let ownerName: string;
        if (user?.id === ownerId) {
          ownerName = getDisplayName(user);
        } else {
          ownerName = (await fetchProfileDisplayName(ownerId)) ?? 'Project owner';
        }
        options.push({ id: ownerId, name: ownerName, initials: initialsFromName(ownerName) });
        seen.add(ownerId);
      }

      try {
        const collaborators = await listProjectCollaborators(projectId);
        for (const member of collaborators) {
          if (member.role === 'owner' || seen.has(member.user_id)) continue;
          const name = member.display_name?.trim() || member.email?.trim() || 'Member';
          options.push({ id: member.user_id, name, initials: initialsFromName(name) });
          seen.add(member.user_id);
        }
      } catch (err) {
        console.error('Failed to load project members for assignee list:', err);
      }

      if (!cancelled) setAssigneeOptions(options);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentProject?.id, currentProject?.user_id, guestMode, user]);

  const assigneeById = useMemo(() => {
    const map = new Map<string, AssigneeOption>();
    for (const option of assigneeOptions) map.set(option.id, option);
    return map;
  }, [assigneeOptions]);

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

    const previous = tasksRef.current.find((t) => t.id === taskId);
    if (!previous || previous.status === newStatus) return;

    const touched = new Date().toISOString();
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: newStatus as Task['status'], updated_at: touched, isAnimated: true }
          : task
      )
    );

    try {
      const { merged, data0 } = await updateTaskRowReturnArray(
        taskId,
        { status: newStatus },
        previous
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data0.id ? { ...merged, isAnimated: true } : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? previous : task))
      );
      toast.error(error instanceof Error ? error.message : 'Could not save status');
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

    const prevTask = tasksRef.current.find((t) => t.id === taskId);
    if (!prevTask) return;
    try {
      const { merged, data0 } = await updateTaskRowReturnArray(taskId, { sprint: newSprint }, prevTask);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data0.id ? { ...merged, isAnimated: true } : task
        )
      );
      toast.success('Sprint updated');
    } catch (error) {
      console.error('Error updating sprint status:', error);
      toast.error(error instanceof Error ? error.message : 'Could not save sprint');
    }
  };

  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    const nextAssignee = newAssigneeId.trim();
    if (guestMode) {
      const touched = new Date().toISOString();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, assignee_id: nextAssignee, updated_at: touched, isAnimated: true }
            : task
        )
      );
      toast.success('Assignee updated');
      return;
    }

    const previous = tasksRef.current.find((t) => t.id === taskId);
    if (!previous || previous.assignee_id === nextAssignee) return;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, assignee_id: nextAssignee } : task
      )
    );

    try {
      const { merged, data0 } = await updateTaskRowReturnArray(
        taskId,
        { assignee_id: nextAssignee || null },
        previous
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === data0.id ? merged : task))
      );
      toast.success('Assignee updated');
    } catch (error) {
      console.error('Error updating assignee:', error);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? previous : task))
      );
      toast.error(error instanceof Error ? error.message : 'Could not save assignee');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (guestMode) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      toast.success('Task deleted');
      return;
    }

    try {
      await deleteTaskRow(taskId);
    } catch (error) {
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
      const merged = await insertTaskRow(newTask);
      setTasks((prevTasks) => [...prevTasks, { ...merged, isAnimated: true }]);
      toast.success('Task created');
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
    const merged = await insertTaskRow(newTask);
    const next = [...tasksRef.current, { ...merged, isAnimated: true, aiBrandish: true }];
    tasksRef.current = next;
    setTasks(next);
    toast.success('Task created');
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
    const t = tasksRef.current.find((x) => x.id === taskId)!;
    const merged = await updateTaskRow(taskId, patch, t);
    const next = tasksRef.current.map((row) =>
      row.id === taskId
        ? { ...merged, isAnimated: true, aiBrandish: true }
        : row
    );
    tasksRef.current = next;
    setTasks(next);
    toast.success('Task updated');
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
    await deleteTaskRow(taskId);
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
      const mergeBase = tasksRef.current.find((t) => t.id === taskId);
      if (!mergeBase) return;
      const { merged, data0 } = await updateTaskRowReturnArray(
        taskId,
        { description: newDescription },
        mergeBase
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data0.id ? { ...merged, isAnimated: true } : task
        )
      );
      toast.success('Description updated');
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error(error instanceof Error ? error.message : 'Could not save description');
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
      const mergeBase = tasksRef.current.find((t) => t.id === taskId);
      if (!mergeBase) return;
      const { merged, data0 } = await updateTaskRowReturnArray(taskId, { title: newTitle }, mergeBase);
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data0.id ? { ...merged, isAnimated: true } : task
        )
      );
      toast.success('Title updated');
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error(error instanceof Error ? error.message : 'Could not save title');
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
      const mergeBase = tasksRef.current.find((t) => t.id === taskId);
      if (!mergeBase) return;
      const { merged, data0 } = await updateTaskRowReturnArray(
        taskId,
        { due_date: formatDueDateForDb(newDueDate) },
        mergeBase
      );
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === data0.id ? { ...merged, isAnimated: true } : task
        )
      );
      toast.success('Due date updated');
    } catch (error) {
      console.error('Error updating due date:', error);
      toast.error(error instanceof Error ? error.message : 'Could not save due date');
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
      const data = await updateProjectRow(currentProject.id, updates);

      setCurrentProject((prev) => (prev ? { ...prev, ...data } : null));
      if (setProjects) {
        const pid = String(data.id ?? currentProject.id);
        setProjects(projects.map((p) => (p.id === pid ? { ...p, ...data } : p)));
      }
      toast.success('Project updated');
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

  const viewSprint = useCallback(
    (sprint: number) => {
      if (!currentProject) return;
      const max = Math.max(1, currentProject.num_sprints ?? 10);
      const nextSprint = clampSprint(sprint, max);
      setActiveSprint(nextSprint);
      writeStoredSprint(currentProject.id, nextSprint);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('sprint', String(nextSprint));
          return next;
        },
        { replace: true }
      );
    },
    [currentProject, setSearchParams]
  );

  // Per-user: only changes which sprint *this* user is viewing. Never writes
  // the shared project state, so browsing a past sprint doesn't move it for
  // the whole team.
  const handleSprintSelect = (sprint: number) => {
    viewSprint(sprint);
  };

  // Shared: explicitly promote the viewed sprint to the team's active sprint.
  const handleSetActiveSprint = async () => {
    if (!currentProject || isSprintUpdating) return;
    const max = Math.max(1, currentProject.num_sprints ?? 10);
    const nextSprint = clampSprint(activeSprint, max);
    if (currentProject.current_sprint === nextSprint) return;

    const prevCurrent = currentProject.current_sprint;

    if (guestMode) {
      setCurrentProject((prev) => (prev ? { ...prev, current_sprint: nextSprint } : null));
      toast.success(`Sprint ${nextSprint} is now the team's active sprint`);
      return;
    }

    setCurrentProject((prev) => (prev ? { ...prev, current_sprint: nextSprint } : null));
    try {
      setIsSprintUpdating(true);
      await updateProjectRow(currentProject.id, { current_sprint: nextSprint });
      if (setProjects) {
        setProjects(
          projects.map((p) =>
            p.id === currentProject.id ? { ...p, current_sprint: nextSprint } : p
          )
        );
      }
      toast.success(`Sprint ${nextSprint} is now the team's active sprint`);
    } catch (error) {
      console.error('Error updating current sprint:', error);
      setCurrentProject((prev) => (prev ? { ...prev, current_sprint: prevCurrent } : null));
      toast.error('Failed to set active sprint');
    } finally {
      setIsSprintUpdating(false);
    }
  };

  const handleAddSprint = async () => {
    if (!currentProject || isSprintUpdating) return;

    const next = currentProject.num_sprints + 1;

    if (guestMode) {
      setCurrentProject((prev) => (prev ? { ...prev, num_sprints: next } : null));
      return;
    }

    try {
      setIsSprintUpdating(true);
      const data = await updateProjectRow(currentProject.id, { num_sprints: next });
      const updatedNumSprints = Number(data.num_sprints ?? next);

      setCurrentProject((prev) => (prev ? { ...prev, num_sprints: updatedNumSprints } : null));
      if (setProjects) {
        setProjects(
          projects.map((p) =>
            p.id === currentProject.id ? { ...p, num_sprints: updatedNumSprints } : p
          )
        );
      }
    } catch (error) {
      console.error('Error adding sprint:', error);
      toast.error('Failed to add sprint');
    } finally {
      setIsSprintUpdating(false);
    }
  };

  const canRemoveLastSprint = useMemo(() => {
    if (!currentProject || currentProject.num_sprints <= 1) return false;
    const last = currentProject.num_sprints;
    return !tasks.some((t) => t.sprint === last);
  }, [currentProject, tasks]);

  const handleRemoveSprint = async () => {
    if (!currentProject || isSprintUpdating || !canRemoveLastSprint) return;

    const prevCount = currentProject.num_sprints;
    const next = prevCount - 1;
    // Clamp the team's shared active sprint only if it no longer exists.
    const nextTeamActive = currentProject.current_sprint > next ? next : currentProject.current_sprint;
    // Clamp this user's view only if they were looking at the removed sprint.
    const nextView = activeSprint > next ? next : activeSprint;

    if (nextView !== activeSprint) viewSprint(nextView);

    if (guestMode) {
      setCurrentProject((prev) =>
        prev ? { ...prev, num_sprints: next, current_sprint: nextTeamActive } : null
      );
      return;
    }

    try {
      setIsSprintUpdating(true);
      const patch: Partial<Project> = { num_sprints: next };
      if (nextTeamActive !== currentProject.current_sprint) {
        patch.current_sprint = nextTeamActive;
      }
      const data = await updateProjectRow(currentProject.id, patch);
      const updatedNumSprints = Number(data.num_sprints ?? next);
      const updatedCurrentSprint = Number(data.current_sprint ?? nextTeamActive);

      setCurrentProject((prev) =>
        prev
          ? {
              ...prev,
              num_sprints: updatedNumSprints,
              current_sprint: updatedCurrentSprint,
            }
          : null
      );
      if (setProjects) {
        setProjects(
          projects.map((p) =>
            p.id === currentProject.id
              ? { ...p, num_sprints: updatedNumSprints, current_sprint: updatedCurrentSprint }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error removing sprint:', error);
      toast.error('Failed to remove sprint');
    } finally {
      setIsSprintUpdating(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (guestMode) return;
    if (!currentProject || isPrivacyUpdating) return;
    
    try {
      setIsPrivacyUpdating(true);
      const newPrivacyStatus = !currentProject.private;
      
      await updateProjectRow(currentProject.id, { private: newPrivacyStatus });

      setCurrentProject((prev) => (prev ? { ...prev, private: newPrivacyStatus } : null));

      const updatedProjects = projects.map((project) =>
        project.id === currentProject.id ? { ...project, private: newPrivacyStatus } : project
      );

      if (setProjects) {
        setProjects(updatedProjects);
      }

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


  const activeFilterCount =
    (assigneeFilter !== '' ? 1 : 0) + (typeFilter !== '' ? 1 : 0) + (priorityFilter !== '' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const clearBoardFilters = () => {
    setAssigneeFilter('');
    setTypeFilter('');
    setPriorityFilter('');
  };

  useEffect(() => {
    if (!isFilterOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isFilterOpen]);

  const toolbarSelectClass = `w-full min-h-[1.875rem] rounded-md border px-2 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500/30 ${
    isDarkMode
      ? 'border-zinc-700/80 bg-zinc-950/60 text-zinc-200'
      : 'border-zinc-200 bg-white text-zinc-800'
  }`;

  const tasksByColumn = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = (t: Task) =>
      !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);

    const matchesFilters = (t: Task) => {
      const assigneeId = (t.assignee_id ?? '').trim();
      if (assigneeFilter === 'unassigned') {
        if (assigneeId) return false;
      } else if (assigneeFilter !== '' && assigneeId !== assigneeFilter) {
        return false;
      }
      if (typeFilter && t.type !== typeFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      return true;
    };

    const out: Record<(typeof BOARD_COLUMNS)[number]['id'], Task[]> = {
      todo: [],
      'in-progress': [],
      done: [],
    };
    for (const t of tasks) {
      if (t.sprint !== activeSprint || !matchesSearch(t) || !matchesFilters(t)) continue;
      if (t.status === 'todo' || t.status === 'in-progress' || t.status === 'done') {
        out[t.status].push(t);
      }
    }
    return out;
  }, [tasks, searchQuery, activeSprint, assigneeFilter, typeFilter, priorityFilter]);

  return (
    <div
      className={`flex min-h-0 w-full flex-1 transition-colors duration-200 ${
        isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'
      }`}
    >
      <div className="min-h-0 flex-1 overflow-auto px-3 py-3 sm:px-4">
        {showMcpBanner ? (
          <div
            className={`mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
              isDarkMode
                ? 'border-teal-500/30 bg-teal-950/25 text-zinc-200'
                : 'border-teal-200 bg-teal-50/80 text-zinc-800'
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Plug className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden />
              <p>
                <span className="font-semibold">Connect Claude or Cursor</span>
                {' '}— use MCP to manage this board from your editor.{' '}
                <Link to="/connect" className="font-semibold text-teal-600 underline-offset-2 hover:underline dark:text-teal-400">
                  Open Connect AI
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={dismissMcpBanner}
              className={`shrink-0 rounded-md p-1 ${
                isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-white/80'
              }`}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
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
                    onClick={() => setIsMembersPanelOpen(true)}
                    aria-label="Manage project members"
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      isDarkMode
                        ? 'border-zinc-700/80 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-200'
                        : 'border-zinc-200 bg-zinc-100/80 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <Users className="h-3 w-3 shrink-0" />
                    Members
                  </button>
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
                  aria-label="View sprint"
                  className={`inline-flex rounded-lg p-0.5 ${
                    isDarkMode ? 'bg-zinc-950/80' : 'bg-zinc-200/50'
                  }`}
                >
                  {Array.from({ length: currentProject.num_sprints }, (_, i) => i + 1).map((sprint) => {
                    const viewing = activeSprint === sprint;
                    const teamActive = currentProject.current_sprint === sprint;
                    return (
                      <button
                        key={sprint}
                        type="button"
                        aria-pressed={viewing}
                        disabled={isSprintUpdating}
                        onClick={() => handleSprintSelect(sprint)}
                        title={teamActive ? `Sprint ${sprint} (team's active sprint)` : `View sprint ${sprint}`}
                        className={`relative min-h-[1.625rem] min-w-[1.625rem] rounded-md px-2 text-xs font-semibold tabular-nums transition-colors disabled:opacity-60 ${
                          viewing
                            ? isDarkMode
                              ? 'bg-zinc-800 text-indigo-300'
                              : 'bg-white text-indigo-800'
                            : isDarkMode
                              ? 'text-zinc-500 hover:text-zinc-300'
                              : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        {sprint}
                        {teamActive ? (
                          <span
                            aria-hidden
                            className={`absolute -top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${
                              isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'
                            }`}
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {currentProject.current_sprint !== activeSprint ? (
                  <button
                    type="button"
                    disabled={isSprintUpdating}
                    onClick={() => void handleSetActiveSprint()}
                    className={`inline-flex min-h-[1.625rem] items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      isDarkMode
                        ? 'text-emerald-300 hover:bg-emerald-950/50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title={`Set sprint ${activeSprint} as the team's active sprint`}
                  >
                    Set active
                  </button>
                ) : (
                  <span
                    className={`inline-flex min-h-[1.625rem] items-center gap-1 rounded-md px-2 text-xs font-medium ${
                      isDarkMode ? 'text-emerald-400/80' : 'text-emerald-600'
                    }`}
                    title="You're viewing the team's active sprint"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`} aria-hidden />
                    Active
                  </span>
                )}
                <button
                  type="button"
                  disabled={isSprintUpdating}
                  onClick={() => void handleAddSprint()}
                  className={`inline-flex min-h-[1.625rem] items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    isDarkMode
                      ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                      : 'text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                  }`}
                  aria-label="Add sprint"
                >
                  <Plus className="h-3 w-3" aria-hidden />
                  Sprint
                </button>
                {canRemoveLastSprint ? (
                  <button
                    type="button"
                    disabled={isSprintUpdating}
                    onClick={() => void handleRemoveSprint()}
                    className={`inline-flex min-h-[1.625rem] items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      isDarkMode
                        ? 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                        : 'text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                    }`}
                    aria-label="Remove last empty sprint"
                    title="Remove last sprint (only when empty)"
                  >
                    <Minus className="h-3 w-3" aria-hidden />
                    Sprint
                  </button>
                ) : null}
              </div>

              <span
                className={`hidden h-5 w-px shrink-0 sm:block ${isDarkMode ? 'bg-zinc-700/80' : 'bg-zinc-300/70'}`}
                aria-hidden
              />

              <div ref={filterRef} className="relative px-1 py-1">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((v) => !v)}
                  aria-haspopup="dialog"
                  aria-expanded={isFilterOpen}
                  className={`inline-flex min-h-[1.75rem] items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors ${
                    hasActiveFilters
                      ? isDarkMode
                        ? 'bg-indigo-950/50 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-700'
                      : isDarkMode
                        ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        : 'text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Filter
                  {activeFilterCount > 0 ? (
                    <span
                      className={`ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                        isDarkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>

                {isFilterOpen ? (
                  <div
                    role="dialog"
                    aria-label="Filter tasks"
                    className={`absolute left-0 top-full z-20 mt-1.5 w-60 max-w-[calc(100vw-2rem)] rounded-xl border p-3 shadow-lg ${
                      isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="board-filter-assignee"
                          className={`mb-1 block text-[10px] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
                        >
                          Assignee
                        </label>
                        <select
                          id="board-filter-assignee"
                          value={assigneeFilter}
                          onChange={(e) => setAssigneeFilter(e.target.value)}
                          className={toolbarSelectClass}
                        >
                          <option value="">All assignees</option>
                          <option value="unassigned">Unassigned</option>
                          {assigneeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="board-filter-type"
                          className={`mb-1 block text-[10px] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
                        >
                          Type
                        </label>
                        <select
                          id="board-filter-type"
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value as '' | TaskType)}
                          className={toolbarSelectClass}
                        >
                          <option value="">All types</option>
                          <option value="feature">Feature</option>
                          <option value="bug">Bug</option>
                          <option value="scope">Scope</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="board-filter-priority"
                          className={`mb-1 block text-[10px] font-semibold uppercase tracking-wide ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
                        >
                          Priority
                        </label>
                        <select
                          id="board-filter-priority"
                          value={priorityFilter}
                          onChange={(e) => setPriorityFilter(e.target.value as '' | Priority)}
                          className={toolbarSelectClass}
                        >
                          <option value="">All priorities</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={clearBoardFilters}
                          className={`w-full rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${
                            isDarkMode
                              ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          Clear all filters
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
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

        {!isLoading && currentProject && tasks.length === 0 ? (
          <div
            className={`mb-4 rounded-xl border px-4 py-4 sm:mb-5 sm:px-5 ${
              isDarkMode
                ? 'border-indigo-500/25 bg-indigo-950/30'
                : 'border-indigo-200/80 bg-indigo-50/60'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  Your board is empty
                </p>
                <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Add a task manually or let the AI assistant break down sprint one — use the panel on the right or the
                  buttons below.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                      : 'bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50'
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  Add first task
                </button>
                <button
                  type="button"
                  onClick={() => setChatOpenRequest((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Plan with AI
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
                          assignee={assigneeById.get((task.assignee_id ?? '').trim())}
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
          chatOpenRequest={chatOpenRequest}
          onCreateTask={handleCreateTaskFromChat}
          onUpdateTask={handleTaskUpdateFromChat}
          onDeleteTask={handleDeleteTaskFromChat}
        />
      </Suspense>

      {selectedTask && (
        <Suspense fallback={null}>
          <TaskModal
            task={selectedTask}
            numSprints={currentProject?.num_sprints ?? 10}
            guestMode={guestMode}
            onClose={() => setSelectedTask(null)}
            onStatusChange={handleStatusChange}
            onSprintChange={handleSprintChange}
            onDescriptionChange={handleDescriptionChange}
            onTitleChange={handleTitleChange}
            onDueDateChange={handleDueDateChange}
            assigneeOptions={assigneeOptions}
            onAssigneeChange={handleAssigneeChange}
          />
        </Suspense>
      )}

      {isCreateModalOpen && (
        <Suspense fallback={null}>
          <CreateTaskModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreateTask={handleCreateTask}
            projectId={currentProject?.id || ''}
            numSprints={currentProject?.num_sprints ?? 10}
            defaultSprint={activeSprint}
            assigneeOptions={assigneeOptions}
          />
        </Suspense>
      )}

      {currentProject && user && !guestMode ? (
        <ProjectMembersPanel
          isOpen={isMembersPanelOpen}
          onClose={() => setIsMembersPanelOpen(false)}
          projectId={currentProject.id}
          projectOwnerId={currentProject.user_id}
          currentUserId={user.id}
          isDarkMode={isDarkMode}
          onMembersChanged={onRefreshProjects}
        />
      ) : null}
    </div>
    
  );
}
