import { Sparkles } from 'lucide-react';
import { isKanbanAiCommentAuthor } from '../lib/kanbanAiComment';

type Surface = 'modal' | 'public';

type Props = {
  authorDisplayName: string | null | undefined;
  initials: string;
  surface: Surface;
  isDarkMode?: boolean;
  size?: 'sm' | 'md';
};

export function TaskCommentAuthorAvatar({
  authorDisplayName,
  initials,
  surface,
  isDarkMode = false,
  size = 'md',
}: Props) {
  const isAi = isKanbanAiCommentAuthor(authorDisplayName);
  const dim = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const iconClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const initialsClass = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  if (isAi) {
    const aiWrap =
      surface === 'modal'
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/25 dark:text-indigo-200 dark:ring-1 dark:ring-indigo-400/30'
        : isDarkMode
          ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/30'
          : 'bg-indigo-100 text-indigo-700';
    return (
      <div
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full ${aiWrap}`}
        aria-hidden
        title="KanbanAI"
      >
        <Sparkles className={iconClass} strokeWidth={2.25} />
      </div>
    );
  }

  const userWrap =
    surface === 'modal'
      ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-100'
      : isDarkMode
        ? 'bg-gray-500 text-gray-100'
        : 'bg-gray-200 text-gray-600';

  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full font-semibold ${initialsClass} ${userWrap}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
