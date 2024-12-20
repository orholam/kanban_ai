import React from 'react';
import { useState, useEffect, useRef } from "react";
import { X, Calendar, MessageSquare, User } from 'lucide-react';
import type { Task } from '../types';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TextareaAutosize from 'react-textarea-autosize';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onSprintChange: (taskId: string, newSprint: number) => void;
  onDescriptionChange: (taskId: string, newDescription: string) => void;
}

export default function TaskModal({ task, onClose, onStatusChange, onSprintChange, onDescriptionChange }: TaskModalProps) {
  const [status, setStatus] = useState(task.status); // Local state for the status
  const [sprint, setSprint] = useState(task.sprint); // Local state for the sprint
  const [dueDate, setDueDate] = useState(new Date(task.due_date));
  const [showCalendar, setShowCalendar] = useState(false);
  const [description, setDescription] = useState(task.description);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Update local state whenever the task prop changes
  useEffect(() => {
    setStatus(task.status);
    setSprint(task.sprint);
  }, [task.status, task.sprint]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus); // Update the local state
    onStatusChange(task.id, newStatus); // Trigger the parent handler
  };

  const handleSprintChange = (e) => {
    const newSprint = parseInt(e.target.value);
    console.log(e.target.value);
    setSprint(newSprint);
    onSprintChange(task.id, newSprint);
  };

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onDescriptionChange(task.id, newDescription);
    }, 3000); // Adjust the delay as needed
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                <div className="flex justify-between space-x-2 mt-1">
                  <p className="text-sm text-left text-gray-500">{task.id}</p>
                  <p className="text-sm text-right text-gray-500">{task.project_id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Status</h3>
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="in-review">In Review</option>
                  </select>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Sprint</h3>
                  <select
                    value={sprint}
                    onChange={handleSprintChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((sprint) => (
                      <option key={sprint} value={sprint}>
                        Sprint {sprint}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                <TextareaAutosize
                  className="text-sm text-gray-500 w-full rounded-md focus:outline-none resize-none"
                  value={description}
                  onChange={handleDescriptionChange}
                  spellCheck={false}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Due Date</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span 
                    className="inline-flex items-center cursor-pointer"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <Calendar className="h-4 w-4 mr-2"/>
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                  {showCalendar && (
                    <div className="absolute z-50 bg-white shadow-lg rounded-md p-2">
                      <DatePicker
                        selected={dueDate}
                        //onChange={handleDateChange}
                        onClickOutside={() => setShowCalendar(false)} // Close when clicking outside
                        inline // Shows the calendar inline
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Assignee</h3>
                <div className="flex items-center">
                  {task.assignee_id.avatar ? (
                    <img
                      src={task.assignee_id.avatar}
                      alt={task.assignee_id.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <span className="ml-2 text-sm text-gray-900">{task.assignee_id.name}</span>
                </div>
              </div>

              {/*
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Comments</h3>
                <div className="space-y-4">
                  {task.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        className="h-8 w-8 rounded-full"
                      />
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">
                            {comment.user.name}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-700">
                          <p>{comment.content}</p>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <textarea
                    rows={3}
                    className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Add a comment..."
                  />
                  <button className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Comment
                  </button>
                </div>
              </div>
              */}
            </div>
          </div>
        </div>
      </div>
  );
}
