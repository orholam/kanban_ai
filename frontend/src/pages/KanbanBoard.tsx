import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Check, X, Eye, EyeOff, FileText, Link } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import NotesEditor from '../components/NotesEditor';
import type { Project, Task } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, differenceInDays } from 'date-fns'; // Import date-fns for date calculations
import { toast } from 'sonner';


const MOCK_NEW_TASK = "Create project wizard using openai to create new projects and automatically generate tasks";


const DEFAULT_DESCRIPTION = "A comprehensive email system overhaul focusing on reliability and performance improvements.";

const STAGGER_DELAY_MS = 100; // Delay between each card animation

interface KanbanBoardProps {
  isDarkMode: boolean;
  projects: Project[];
  searchQuery: string;
  setProjects?: (projects: Project[]) => void;
}

export default function KanbanBoard({ isDarkMode, projects, searchQuery, setProjects }: KanbanBoardProps) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]); // Add explicit Task[] type
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState(1);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isCondensed, setIsCondensed] = useState(() => {
    const saved = localStorage.getItem('kanban-condensed-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isPrivacyUpdating, setIsPrivacyUpdating] = useState(false);

  const handleCondensedToggle = (newValue: boolean) => {
    setIsCondensed(newValue);
    localStorage.setItem('kanban-condensed-mode', JSON.stringify(newValue));
  };


  useEffect(() => {
    if (projects.length === 0) return;

    let project;
    console.log("checking if projectId is defined");
    console.log(projectId);
    if (projectId !== undefined) {
      // If projectId exists in URL, find that project
      console.log("setting project to first project");
      project = projects.find(p => p.id === projectId);
    }
    // If no projectId or project not found, use first project
    if (project === undefined) {
      project = projects[0];
    }
    setCurrentProject(project);
  }, [projectId, projects]);

  useEffect(() => {
    if (!currentProject?.id) return;
    
    const fetchData = async () => {
      // Skip if we already have tasks for this project
      if (tasks.some(task => task.project_id === currentProject.id)) {
        return;
      }

      try {
        setIsLoading(true);
        let { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', currentProject.id);

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        if (tasks) {
          setTasks(tasks);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    setDaysLeft(differenceInDays(new Date(currentProject?.due_date), new Date()));
  }, [currentProject?.id]);


  const columns = [
    { id: 'todo', title: 'Todo' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  {/* handle status change from todo to in progress to done etc.*/}
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select()

    if (error) {
      console.error('Error updating task status:', error);
      return;
    }

    if (data) {
      console.log(data[0]);
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === data[0].id ? { ...data[0], isAnimated: true } : task
      ));
    }
  };

  {/* handle notes change */}
  const handleNotesChange = async (newNotes: string) => {
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
    const { data, error } = await supabase
    .from('tasks')
    .update({ sprint: newSprint })
    .eq('id', taskId)
    .select()

    if (error) {
      console.error('Error updating sprint status:', error);
      return;
    }
    if (data) {
      console.log(data[0]);
      setTasks(prevTasks => prevTasks.map(task => (task.id === data[0].id ? { ...data[0], isAnimated: true } : task)));
      toast.success('Sprint updated');
    }
  };

  const handleDeleteTask = async (taskId: string) => {

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
    try {
      console.log("trying to create new task!");
      console.log(newTask);
      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTasks(prevTasks => [...prevTasks, { ...data, isAnimated: true }]);
        toast.success('Task created');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDescriptionChange = async (taskId: string, newDescription: string) => {
    try {
      const { data, error } = await supabase
      .from('tasks')
      .update({ description: newDescription })
      .eq('id', taskId)
      .select()

      if (error) {
        console.error('Error updating description:', error);
        return;
      }
      if (data) {
        console.log(data[0]);
        setTasks(prevTasks => prevTasks.map(task => (task.id === data[0].id ? { ...data[0], isAnimated: true } : task)));
        toast.success('Description updated');
      }
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleTitleChange = async (taskId: string, newTitle: string) => {
    try {
      const { data, error } = await supabase
      .from('tasks')
      .update({ title: newTitle })
      .eq('id', taskId)
      .select()

      if (error) {
        console.error('Error updating title:', error);
        return;
      }
      if (data) {
        console.log(data[0]);
        setTasks(prevTasks => prevTasks.map(task => (task.id === data[0].id ? { ...data[0], isAnimated: true } : task)));
        toast.success('Title updated');
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  const handleDueDateChange = async (taskId: string, newDueDate: Date) => {
    try {
      const { data, error } = await supabase
      .from('tasks')
      .update({ due_date: newDueDate.toISOString() })
      .eq('id', taskId)
      .select()

      if (error) {
        console.error('Error updating due date:', error);
        return;
      }
      if (data) {
        console.log(data[0]);
        setTasks(prevTasks => prevTasks.map(task => (task.id === data[0].id ? { ...data[0], isAnimated: true } : task)));
        toast.success('Due date updated');
      }
    } catch (error) {
      console.error('Error updating due date:', error);
    }
  };

  const handlePrivacyToggle = async () => {
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
          } catch (clipboardError) {
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
    } catch (clipboardError) {
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    handleStatusChange(taskId, columnId);
    setDragOverColumn(null);
  };


  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`h-full overflow-auto p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="mb-6">
        <div className="flex items-stretch justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentProject?.title}</h1>
              {currentProject && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrivacyToggle}
                    disabled={isPrivacyUpdating}
                    aria-label={`Make project ${currentProject.private === false ? 'private' : 'public'}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                      currentProject.private === false 
                        ? isDarkMode ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-100 text-green-600 hover:bg-green-200'
                        : isDarkMode ? 'bg-gray-700/50 text-gray-400 hover:bg-gray-700/70' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                    }`}
                    title={`Click to make project ${currentProject.private === false ? 'private' : 'public'}`}
                  >
                    <div className="flex items-center">
                      {isPrivacyUpdating ? (
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
                      ) : currentProject.private === false ? (
                        <Eye className="h-3.5 w-3.5" />
                        ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${
                      currentProject.private === false 
                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isPrivacyUpdating ? 'Updating...' : (currentProject.private === false ? 'Public' : 'Private')}
                    </span>
                  </button>
                  {currentProject.private === false && (
                    <button
                      onClick={handleCopyProjectLink}
                      aria-label="Copy project link"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                      title="Copy project link to clipboard"
                    >
                      <Link className="h-3.5 w-3.5" />
                      <span className={`text-xs font-medium ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        Copy Link
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{currentProject?.description}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mt-4">
          <div className="flex space-x-2">
            {currentProject && Array.from({ length: currentProject.num_sprints }, (_, i) => i + 1).map((sprint) => (
              <button
                key={sprint}
                onClick={() => setActiveSprint(sprint)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${activeSprint === sprint
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode 
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' 
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                  }`}
              >
                {sprint}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Condensed:
              </label>
              <button
                onClick={() => handleCondensedToggle(!isCondensed)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  isCondensed 
                    ? 'bg-indigo-600' 
                    : isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isCondensed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition-all duration-200 ease-in-out ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-6 py-2 rounded-md shadow-sm text-sm font-medium text-white w-40
                  bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700
                  transition-all duration-200 ease-in-out"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* setup three column structure*/}
      <div className="grid grid-cols-3 gap-6 min-h-fit">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg p-4 ${
              dragOverColumn === column.id ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {column.title}
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({filteredTasks.filter(task => task.status === column.id && task.sprint === activeSprint).length})
                </span>
              </h3>
            </div>
            <div className="space-y-4">
              {filteredTasks
                .filter(task => task.status === column.id && task.sprint === activeSprint)
                .map((task, index) => (
                  <div
                    key={task.id}
                    className={`${!isLoading && !task.isAnimated ? 'transform opacity-0 translate-y-4 blur-sm animate-[fade-in-up_.8s_ease-out_forwards]' : ''}`}
                    style={{ animationDelay: `${index * STAGGER_DELAY_MS}ms` }}
                  >
                    <TaskCard
                      task={task}
                      onClick={setSelectedTask}
                      onDeleteTask={handleDeleteTask}
                      isDarkMode={isDarkMode}
                      isCondensed={isCondensed}
                    />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onSprintChange={handleSprintChange}
          onDescriptionChange={handleDescriptionChange}
          onTitleChange={handleTitleChange}
          onDueDateChange={handleDueDateChange}
        />
      )}

      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
          projectId={currentProject?.id || ''}
        />
      )}

      {/* Notes Editor */}
      <NotesEditor isOpen={isNotesOpen} onToggle={() => setIsNotesOpen(!isNotesOpen)} initialNotes={currentProject?.notes} onNotesChange={handleNotesChange}/>
    </div>
    
  );
}
