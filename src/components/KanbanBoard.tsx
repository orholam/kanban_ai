import React, { useState, useEffect } from 'react';
import { Plus, Filter, Share, Eye, Pencil, Check, X } from 'lucide-react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import type { Task } from '../types';
import { createTask }from '../api/createTask';


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

export default function KanbanBoard() {
  //const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [tasks, setTasks] = useState([]); // default blank instead of mock data
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [activeSprint, setActiveSprint] = useState(1);
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(description);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const taskRaw = await fetch('http://localhost:5000/api/tasks');
        if (!taskRaw.ok) {
          throw new Error(`HTTP error! Status: ${taskRaw.status}`);
        }
        const taskData = await taskRaw.json();
        console.log("taskData");
        console.log(taskData);
        setTasks(taskData);
      } catch (err) {
        console.error('Failed to fetch tasks: ', err);
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
    const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/status`, {
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
    const response = await fetch(`http://localhost:5000/api/tasks/${taskId}/sprint`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sprint: newSprint }),
    });

    const updatedTask = await response.json();
    setTasks(prevTasks => prevTasks.map(task => (task.id === updatedTask.id ? updatedTask : task)));
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
    <div className="flex-1 bg-gray-50 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Email Project</h1>
          {!isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
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
          <p className="text-sm text-gray-600 mb-4">{description}</p>
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
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                {sprint}
              </button>
            ))}
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => createTask("Add a trash icon to the bottom right of each task card")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Share className="h-4 w-4 mr-2" />
              Share
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Eye className="h-4 w-4 mr-2" />
              View
            </button>
          </div>
        </div>
      </div>

      {/* setup three column structure*/}
      <div className="grid grid-cols-3 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`bg-gray-100 rounded-lg p-4 ${
              dragOverColumn === column.id ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {column.title}
                <span className="ml-2 text-sm text-gray-500">
                  ({tasks.filter(task => task.status === column.id && task.sprint === activeSprint).length})
                </span>
              </h3>
              <button className="p-1 hover:bg-gray-200 rounded">
                <Plus className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {tasks
                .filter(task => task.status === column.id && task.sprint === activeSprint)
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={setSelectedTask}
                  />
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
