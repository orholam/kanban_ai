import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocMarkdownProps {
  isDarkMode: boolean;
  markdown: string;
}

/** Markdown renderer scoped to the documentation board feature (mirrors BlogPost styling). */
export default function DocMarkdown({ isDarkMode, markdown }: DocMarkdownProps) {
  return (
    <div
      className={`markdown-content prose prose-sm max-w-none sm:prose-base ${isDarkMode ? 'prose-invert' : ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children, ...props }) => (
            <p
              className={`text-base leading-relaxed mb-4 last:mb-0 ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
              }`}
              {...props}
            >
              {children}
            </p>
          ),
          a: ({ children, ...props }) => (
            <a
              className={`font-medium underline decoration-1 underline-offset-2 transition-colors ${
                isDarkMode
                  ? 'text-indigo-400 decoration-indigo-500/40 hover:text-indigo-300'
                  : 'text-indigo-700 decoration-indigo-200 hover:text-indigo-900'
              }`}
              {...props}
            >
              {children}
            </a>
          ),
          h1: ({ children, ...props }) => (
            <h1
              className={`text-3xl font-bold mb-4 mt-8 first:mt-0 border-b pb-2 ${
                isDarkMode ? 'text-white border-zinc-700' : 'text-zinc-900 border-zinc-300'
              }`}
              {...props}
            >
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2
              className={`scroll-mt-24 text-xl font-semibold mb-3 mt-8 border-b pb-2 first:mt-0 sm:text-2xl ${
                isDarkMode ? 'text-white border-zinc-800' : 'text-zinc-900 border-zinc-200'
              }`}
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3
              className={`text-xl font-medium mb-2 mt-5 first:mt-0 ${
                isDarkMode ? 'text-white' : 'text-zinc-900'
              }`}
              {...props}
            >
              {children}
            </h3>
          ),
          ul: ({ children, ...props }) => (
            <ul
              className={`list-disc list-inside mb-4 space-y-2 last:mb-0 ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
              }`}
              {...props}
            >
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol
              className={`list-decimal list-inside mb-4 space-y-2 last:mb-0 ${
                isDarkMode ? 'text-zinc-300' : 'text-zinc-700'
              }`}
              {...props}
            >
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className={`text-base ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong
              className={`font-semibold ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}
              {...props}
            >
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className={`italic ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`} {...props}>
              {children}
            </em>
          ),
          code: ({ children, ...props }) => (
            <code
              className={`px-2 py-1 rounded text-sm font-mono ${
                isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'
              }`}
              {...props}
            >
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre
              className={`p-4 rounded-lg overflow-x-auto mb-4 last:mb-0 ${
                isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
              }`}
              {...props}
            >
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote
              className={`border-l-4 pl-4 italic my-4 ${
                isDarkMode
                  ? 'border-indigo-500 text-zinc-400 bg-zinc-800/50'
                  : 'border-indigo-300 text-zinc-600 bg-zinc-100'
              }`}
              {...props}
            >
              {children}
            </blockquote>
          ),
          hr: ({ ...props }) => (
            <hr className={`my-6 ${isDarkMode ? 'border-zinc-700' : 'border-zinc-300'}`} {...props} />
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table
                className={`w-full border-collapse border ${isDarkMode ? 'border-zinc-700' : 'border-zinc-300'}`}
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className={isDarkMode ? 'bg-zinc-800' : 'bg-zinc-100'} {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
          th: ({ children, ...props }) => (
            <th
              className={`border px-4 py-2 text-left text-sm font-semibold ${
                isDarkMode ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-zinc-200 bg-zinc-50 text-zinc-900'
              }`}
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td
              className={`border px-4 py-2 text-sm ${
                isDarkMode ? 'border-zinc-700 text-zinc-300' : 'border-zinc-200 text-zinc-700'
              }`}
              {...props}
            >
              {children}
            </td>
          ),
          tr: ({ children, ...props }) => (
            <tr className={isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'} {...props}>
              {children}
            </tr>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
