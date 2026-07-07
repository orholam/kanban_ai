import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskCommentBodyProps {
  body: string;
  /** `modal` matches TaskModal; `public` is slightly smaller for public board cards. */
  variant?: 'modal' | 'public';
}

/** Renders task comment bodies as markdown (GFM). Plain text still works. */
export function TaskCommentBody({ body, variant = 'modal' }: TaskCommentBodyProps) {
  const sizeClass =
    variant === 'public'
      ? 'text-xs prose-sm prose-p:text-xs prose-li:text-xs prose-headings:text-xs'
      : 'text-sm prose-sm';

  return (
    <div
      className={`task-comment-body prose max-w-none dark:prose-invert ${sizeClass} prose-p:my-1.5 prose-p:leading-relaxed prose-p:break-words prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold prose-h1:text-base prose-h2:text-sm prose-h3:text-sm prose-pre:my-2 prose-pre:max-w-full prose-pre:overflow-x-auto prose-pre:text-xs prose-code:break-words prose-code:text-xs prose-a:font-medium prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-indigo-400 text-gray-700 dark:text-gray-300`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  );
}
