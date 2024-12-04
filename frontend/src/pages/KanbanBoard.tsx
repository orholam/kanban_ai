import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Check, X } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import CreateTaskModal from '../components/CreateTaskModal';
import type { Project, Task } from '../types';
import { createTask }from '../api/createTask';
import { API_ENDPOINTS } from '../config/apiConfig';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from '../lib/supabase';


const MOCK_NEW_TASK = "Create project wizard using openai to create new projects and automatically generate tasks";


const DEFAULT_DESCRIPTION = "A comprehensive email system overhaul focusing on reliability and performance improvements.";

const STAGGER_DELAY_MS = 100; // Delay between each card animation

interface KanbanBoardProps {
  isDarkMode: boolean;
  projects: Project[];
}

export interface Task {
  id: string;
  // ... other existing properties ...
  isAnimated?: boolean;
}

export default function KanbanBoard({ isDarkMode, projects }: KanbanBoardProps) {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]); // Add explicit Task[] type
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState(1);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // const handleSprintChange = (taskId: string, newSprint: number) => {
  //   const updatedTasks = tasks.map(task =>
  //     task.id === taskId ? { ...task, sprint: newSprint } : task
  //   );
  //   setTasks(updatedTasks);
  //
  //   if (selectedTask?.id === taskId) {
  //     const updatedTask = updatedTasks.find(task => task.id === taskId);
  //     if (updatedTask) setSelectedTask(updatedTask);
  //   }
  // };

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

  const handleDescriptionSave = () => {
    setDescription(tempDescription);
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setTempDescription(description);
    setIsEditingDescription(false);
  };

  return (
    <div className={`h-full overflow-auto p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentProject?.title}</h1>
          <div className="flex items-center gap-2">
            {!isEditingDescription && (
              <button
                onClick={() => setIsEditingDescription(true)}
                className={`text-gray-400 hover:${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {isEditingDescription ? (
          <div className="flex items-start space-x-2">
            <textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              className="flex-1 p-2 text-sm text-gray-600 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleDescriptionSave}
                className="p-2 text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={handleDescriptionCancel}
                className="p-2 text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{currentProject?.description}</p>
        )}

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
          <div className="flex space-x-4">
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
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {column.title}
                <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ({tasks.filter(task => task.status === column.id && task.sprint === activeSprint).length})
                </span>
              </h3>
              <button className={`p-1 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}>
                <Plus className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="space-y-4">
              {tasks
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
        />
      )}

      {isCreateModalOpen && (
        <CreateTaskModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateTask={handleCreateTask}
          projectId={projectId || ''}
        />
      )}
    </div>
  );
}
