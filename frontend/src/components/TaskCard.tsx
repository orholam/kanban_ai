import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Task } from '../types';
import { KANBAN_TASK_DRAG_MIME } from '../lib/taskDnD';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isDarkMode: boolean;
  isCondensed: boolean;
}

export default function TaskCard({ task, onClick, onDeleteTask, isDarkMode , isCondensed}: TaskCardProps) {
  const priorityPill = {
    low: isDarkMode
      ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25'
      : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/90',
    medium: isDarkMode
      ? 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25'
      : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/90',
    high: isDarkMode
      ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25'
      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/90',
  };

  const typePill = {
    bug: isDarkMode
      ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25'
      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/90',
    feature: isDarkMode
      ? 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/25'
      : 'bg-sky-50 text-sky-800 ring-1 ring-sky-200/90',
    scope: isDarkMode
      ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25'
      : 'bg-violet-50 text-violet-800 ring-1 ring-violet-200/90',
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteTask(task.id);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(KANBAN_TASK_DRAG_MIME, JSON.stringify(task));
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'copy';
        e.currentTarget.classList.add('opacity-50');
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove('opacity-50');
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onClick={() => onClick(task)}
      className={`cursor-move rounded-xl border px-3.5 py-3.5 transition-[background-color,border-color] sm:px-4 sm:py-4 ${
        isDarkMode
          ? 'border-zinc-800/40 bg-zinc-900/25 hover:border-zinc-700/50 hover:bg-zinc-900/45'
          : 'border-zinc-200/35 bg-white/70 hover:border-zinc-200/55 hover:bg-white'
      }`}
    >
      {isCondensed ? (
        <div className="flex min-h-[2.75rem] items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className={`text-sm font-medium leading-snug ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
              {task.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize leading-snug ${typePill[task.type]}`}
              >
                {task.type}
              </span>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize leading-snug ${priorityPill[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className={`shrink-0 pt-0.5 ${isDarkMode ? 'text-zinc-500 hover:text-rose-400' : 'text-zinc-400 hover:text-rose-600'} transition-colors`}
          >
            <Trash2 className="h-[1.125rem] w-[1.125rem]" />
          </button>
        </div>
      ) : (
        <>
          <h3 className={`mb-2 text-sm font-medium leading-snug ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
            {task.title}
          </h3>

          {task.description && (
            <div className="mb-2.5">
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                {task.description.length > 120 
                  ? `${task.description.substring(0, 120)}...` 
                  : task.description
                }
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize leading-snug ${typePill[task.type]}`}
              >
                {task.type}
              </span>
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize leading-snug ${priorityPill[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
            <button
              onClick={handleDelete}
              className={`${isDarkMode ? 'text-zinc-500 hover:text-rose-400' : 'text-zinc-400 hover:text-rose-600'} transition-colors`}
            >
              <Trash2 className="h-[1.125rem] w-[1.125rem]" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
