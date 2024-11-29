import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Check, X } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import type { Task } from '../types';
import { createTask }from '../api/createTask';
import { API_ENDPOINTS } from '../config/apiConfig';

const MOCK_NEW_TASK = "Test new supabase task/project integration";
const MOCK_TASKS: Task[] = [
  {
    id: 'MSP-105',
    projectID: '123qrep-8673',
    title: 'Email delivery error',
    description: 'Users are reporting delays in email delivery system',
    type: 'bug',
    priority: 'high',
    status: 'todo',
    sprint: 1,
    dueDate: '2024-03-20',
    assignee: {
      id: '1',
      name: 'John Doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    comments: [
      {
        id: '1',
        userId: '2',
        content: 'This needs immediate attention',
        createdAt: '2024-03-15T10:00:00Z',
        user: {
          name: 'Jane Smith',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        }
      }
    ]
  },
  {
    id: 'MSP-106',
    projectID: '123qrep-8673',
    title: 'Build Email Notification w/ Library',
    description: 'Scoping has been completed. Integrate selected notification library into frontend, using websocket. Check that package.json file is updated.',
    type: 'feature',
    priority: 'medium',
    status: 'todo',
    sprint: 1,
    dueDate: '2024-03-25',
    assignee: {
      id: '1',
      name: 'Callum Scott',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    comments: [
      {
        id: '1',
        userId: '2',
        content: 'This needs immediate attention',
        createdAt: '2024-03-15T10:00:00Z',
        user: {
          name: 'Jane Smith',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        }
      }
    ]
  }
];

const DEFAULT_DESCRIPTION = "A comprehensive email system overhaul focusing on reliability and performance improvements.";

const STAGGER_DELAY_MS = 100; // Delay between each card animation

interface KanbanBoardProps {
  isDarkMode: boolean;
}

export default function KanbanBoard({ isDarkMode }: KanbanBoardProps) {
  //const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [tasks, setTasks] = useState<Task[]>([]); // Add explicit Task[] type
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState(1);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const taskRaw = await fetch(API_ENDPOINTS.tasks);
        if (!taskRaw.ok) {
          throw new Error(`HTTP error! Status: ${taskRaw.status}`);
        }
        const taskData = await taskRaw.json();
        console.log("taskData");
        console.log(taskData);
        setTasks(taskData);
      } catch (err) {
        console.error('Failed to fetch tasks: ', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    console.log(tasks)
  }, []);

  const columns = [
    { id: 'todo', title: 'Todo' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  {/* handle status change from todo to in progress to done etc.*/}
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const response = await fetch(`${API_ENDPOINTS.tasks}/${taskId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const updatedTask = await response.json();
    setTasks(prevTasks => prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  };

  {/* handle sprint change */}
  const handleSprintChange = async (taskId: string, newSprint: number) => {
    const response = await fetch(`${API_ENDPOINTS.tasks}/${taskId}/sprint`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sprint: newSprint }),
    });

    const updatedTask = await response.json();
    setTasks(prevTasks => prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
  };

  const handleDeleteTask = async (taskId: string) => {
    const response = await fetch(`${API_ENDPOINTS.tasks}/${taskId}`, {
      method: 'DELETE',
    });
  
    if (response.ok) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };

  const handleCreateTask = async (task_description: string) => {
    const response = await createTask(task_description);
    if (response) {
      setTasks(prevTasks => [...prevTasks, response]);
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
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Project</h1>
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
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>{description}</p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 mt-4">
          <div className="flex space-x-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((sprint) => (
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
              onClick={() => handleCreateTask(MOCK_NEW_TASK)}
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
                    className={`transform opacity-0 translate-y-4 blur-sm animate-[fade-in-up_.8s_ease-out_forwards]`}
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
    </div>
  );
}
