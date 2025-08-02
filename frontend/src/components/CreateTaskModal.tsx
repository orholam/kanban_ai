import React from 'react';
import { useState } from "react";
import { X, Calendar } from 'lucide-react';
import type { Task } from '../types';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreateTask: (task: Task) => void;
  projectId: string;
}

export default function CreateTaskModal({ onClose, onCreateTask, projectId }: CreateTaskModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [sprint, setSprint] = useState(1);
  const [dueDate, setDueDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [type, setType] = useState('feature');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask: Task = {
      id: uuidv4(),
      project_id: projectId,
      title: title,
      description: description,
      type: type as 'bug' | 'feature' | 'scope',
      priority: priority as 'low' | 'medium' | 'high',
      status: status as 'todo' | 'in-progress' | 'in-review',
      sprint: parseInt(sprint.toString()),
      due_date: dueDate.toISOString().split('T')[0],
      assignee_id: user?.id || '',
      created_at: new Date().toISOString().split('T')[0],
    };

    onCreateTask(newTask);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="text-sm font-medium text-gray-900 block mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="text-sm font-medium text-gray-900 block mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                </select>
              </div>
              <div>
                <label htmlFor="sprint" className="text-sm font-medium text-gray-900 block mb-2">
                  Sprint
                </label>
                <select
                  id="sprint"
                  value={sprint}
                  onChange={(e) => setSprint(parseInt(e.target.value))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((sprintNum) => (
                    <option key={sprintNum} value={sprintNum}>
                      Sprint {sprintNum}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type" className="text-sm font-medium text-gray-900 block mb-2">
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="scope">Scope</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="text-sm font-medium text-gray-900 block mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium text-gray-900 block mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 block mb-2">
                Due Date
              </label>
              <div className="flex items-center text-sm text-gray-500">
                <span 
                  className="inline-flex items-center cursor-pointer"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar className="h-4 w-4 mr-2"/>
                  {dueDate.toLocaleDateString()}
                </span>
                {showCalendar && (
                  <div className="absolute z-50 bg-white shadow-lg rounded-md p-2">
                    <DatePicker
                      selected={dueDate}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setDueDate(date);
                          setShowCalendar(false);
                        }
                      }}
                      onClickOutside={() => setShowCalendar(false)}
                      inline
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
