import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, Tag, ArrowLeft, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '../lib/blogUtils';
import SEO from '../components/SEO';
import { format } from 'date-fns';

interface BlogPostProps {
  isDarkMode: boolean;
}

export default function BlogPost({ isDarkMode }: BlogPostProps) {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <SEO 
        title={`${post.title} - Kanban AI Blog`}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        url={`https://kanbanai.dev/blog/${post.id}`}
      />
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back to Blog Link */}
          <Link
            to="/blog"
            className={`inline-flex items-center mb-8 text-sm font-medium transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <article>
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    isDarkMode
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  <Tag className="w-3 h-3 mr-1.5" />
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1
              className={`text-4xl font-bold mb-4 leading-tight ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className={`flex flex-wrap items-center gap-6 mb-8 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <time dateTime={post.date}>
                  {format(new Date(post.date), 'MMMM d, yyyy')}
                </time>
              </div>
            </div>

            {/* Excerpt */}
            <p
              className={`text-lg mb-8 leading-relaxed ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {post.excerpt}
            </p>

            {/* Article Content */}
            <div className={`markdown-content prose prose-lg max-w-none ${
              isDarkMode ? 'prose-invert' : ''
            }`}>
              <ReactMarkdown
                components={{
                  p: ({ children, ...props }) => (
                    <p
                      className={`text-base leading-relaxed mb-4 last:mb-0 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  a: ({ children, ...props }) => (
                    <a
                      className={`hover:underline transition-colors ${
                        isDarkMode
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-600 hover:text-blue-500'
                      }`}
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ children, ...props }) => (
                    <h1
                      className={`text-3xl font-bold mb-4 mt-8 first:mt-0 border-b pb-2 ${
                        isDarkMode
                          ? 'text-white border-gray-700'
                          : 'text-gray-900 border-gray-300'
                      }`}
                      {...props}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2
                      className={`text-2xl font-semibold mb-3 mt-6 first:mt-0 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      {...props}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3
                      className={`text-xl font-medium mb-2 mt-5 first:mt-0 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      {...props}
                    >
                      {children}
                    </h3>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul
                      className={`list-disc list-inside mb-4 space-y-2 last:mb-0 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                      {...props}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol
                      className={`list-decimal list-inside mb-4 space-y-2 last:mb-0 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                      {...props}
                    >
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li
                      className={`text-base ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                      {...props}
                    >
                      {children}
                    </li>
                  ),
                  strong: ({ children, ...props }) => (
                    <strong
                      className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                      {...props}
                    >
                      {children}
                    </strong>
                  ),
                  em: ({ children, ...props }) => (
                    <em
                      className={`italic ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}
                      {...props}
                    >
                      {children}
                    </em>
                  ),
                  code: ({ children, ...props }) => (
                    <code
                      className={`px-2 py-1 rounded text-sm font-mono ${
                        isDarkMode
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ children, ...props }) => (
                    <pre
                      className={`p-4 rounded-lg overflow-x-auto mb-4 last:mb-0 ${
                        isDarkMode
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-100 text-gray-800'
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
                          ? 'border-indigo-500 text-gray-400 bg-gray-800/50'
                          : 'border-indigo-300 text-gray-600 bg-gray-100'
                      }`}
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                  hr: ({ ...props }) => (
                    <hr
                      className={`my-6 ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-300'
                      }`}
                      {...props}
                    />
                  ),
                  table: ({ children, ...props }) => (
                    <div className="overflow-x-auto my-6">
                      <table
                        className={`w-full border-collapse border ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-300'
                        }`}
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children, ...props }) => (
                    <thead
                      className={
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                      }
                      {...props}
                    >
                      {children}
                    </thead>
                  ),
                  tbody: ({ children, ...props }) => (
                    <tbody {...props}>
                      {children}
                    </tbody>
                  ),
                  th: ({ children, ...props }) => (
                    <th
                      className={`border border-gray-600 px-4 py-2 text-left font-semibold ${
                        isDarkMode
                          ? 'border-gray-700 bg-gray-800 text-white'
                          : 'border-gray-300 bg-gray-100 text-gray-900'
                      }`}
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td
                      className={`border border-gray-600 px-4 py-2 ${
                        isDarkMode
                          ? 'border-gray-700 text-gray-300'
                          : 'border-gray-300 text-gray-700'
                      }`}
                      {...props}
                    >
                      {children}
                    </td>
                  ),
                  tr: ({ children, ...props }) => (
                    <tr
                      className={`${
                        isDarkMode
                          ? 'hover:bg-gray-800/50'
                          : 'hover:bg-gray-50'
                      }`}
                      {...props}
                    >
                      {children}
                    </tr>
                  ),
                }}
              >
                {post.body}
              </ReactMarkdown>
            </div>
          </article>

          {/* Back to Blog Link (Bottom) */}
          <div className={`mt-12 pt-8 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <Link
              to="/blog"
              className={`inline-flex items-center text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

