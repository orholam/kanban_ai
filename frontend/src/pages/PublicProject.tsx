import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, EyeOff, Calendar, Users, Clock, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Project, Task } from '../types';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface PublicProjectProps {
  isDarkMode: boolean;
}

export default function PublicProject({ isDarkMode }: PublicProjectProps) {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent search engine indexing
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    const metaGooglebot = document.createElement('meta');
    metaGooglebot.name = 'googlebot';
    metaGooglebot.content = 'noindex, nofollow';
    document.head.appendChild(metaGooglebot);

    return () => {
      // Clean up meta tags when component unmounts
      document.head.removeChild(metaRobots);
      document.head.removeChild(metaGooglebot);
    };
  }, []);

  useEffect(() => {
    const fetchPublicProject = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        
        // Fetch the project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('private', false) // Only fetch public projects
          .single();

        if (projectError) {
          if (projectError.code === 'PGRST116') {
            setError('Project not found or is private');
          } else {
            setError('Failed to load project');
          }
          return;
        }

        if (!projectData) {
          setError('Project not found');
          return;
        }

        setProject(projectData);

        // Fetch tasks for this project
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId);

        if (tasksError) {
          console.error('Error fetching tasks:', tasksError);
        } else if (tasksData) {
          console.log('Tasks fetched:', tasksData);
          console.log('Tasks length:', tasksData.length);
          setTasks(tasksData);
        } else {
          console.log('No tasks data received');
        }

      } catch (err) {
        console.error('Error fetching public project:', err);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicProject();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'
          }`}>
            <EyeOff className="w-8 h-8" />
          </div>
          <h1 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {error || 'Project Not Found'}
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            This project may be private or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Calculate project statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Navigation Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className={`flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              ← Back to Kanban AI
            </a>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Public Project
            </div>
          </div>
        </div>
      </div>
      
      {/* Project Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'
              }`}>
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Public Project</span>
              </div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {project.title}
              </h1>
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
            </div>
          </div>
          <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {project.description}
          </p>
          
          {/* Social Sharing */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Share:</span>
            <button
              onClick={() => {
                const url = `${window.location.origin}/public/project/${project.id}`;
                navigator.clipboard.writeText(url);
                toast.success('Project URL copied to clipboard!');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">


          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-100'}`}>
                <CheckCircle className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Completed</p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {completedTasks}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'}`}>
                <Clock className={`h-6 w-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>In Progress</p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {inProgressTasks}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <Users className={`h-6 w-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Tasks</p>
                <p className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {totalTasks}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Notes
          </h2>
          {project.notes ? (
            <div className="markdown-content prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children, ...props }) => <p className={`text-base leading-relaxed mb-4 last:mb-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props}>{children}</p>,
                  a: ({ children, ...props }) => <a className={`text-blue-400 hover:text-blue-300 hover:underline transition-colors ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} {...props}>{children}</a>,
                  h1: ({ children, ...props }) => <h1 className={`text-2xl font-bold mb-4 mt-6 first:mt-0 border-b border-gray-600 pb-2 ${isDarkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-300'}`} {...props}>{children}</h1>,
                  h2: ({ children, ...props }) => <h2 className={`text-xl font-semibold mb-3 mt-5 first:mt-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>{children}</h2>,
                  h3: ({ children, ...props }) => <h3 className={`text-lg font-medium mb-2 mt-4 first:mt-0 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>{children}</h3>,
                  ul: ({ children, ...props }) => <ul className={`list-disc list-inside mb-4 space-y-1 last:mb-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props}>{children}</ul>,
                  ol: ({ children, ...props }) => <ol className={`list-decimal list-inside mb-4 space-y-1 last:mb-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} {...props}>{children}</ol>,
                  li: ({ children, ...props }) => <li className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} {...props}>{children}</li>,
                  strong: ({ children, ...props }) => <strong className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`} {...props}>{children}</strong>,
                  em: ({ children, ...props }) => <em className={`italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} {...props}>{children}</em>,
                  code: ({ children, ...props }) => <code className={`bg-gray-700 text-gray-200 px-2 py-1 rounded text-sm font-mono shadow-sm ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-800'}`} {...props}>{children}</code>,
                  pre: ({ children, ...props }) => <pre className={`bg-gray-800 text-gray-200 p-4 rounded-lg overflow-x-auto mb-4 last:mb-0 shadow-sm ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`} {...props}>{children}</pre>,
                  blockquote: ({ children, ...props }) => <blockquote className={`border-l-4 border-gray-600 pl-4 italic mb-4 last:mb-0 shadow-sm ${isDarkMode ? 'text-gray-400 bg-gray-800/50' : 'text-gray-600 bg-gray-100'}`} {...props}>{children}</blockquote>,
                  hr: ({ ...props }) => <hr className={`my-6 border-gray-600 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} {...props} />,
                  table: ({ children, ...props }) => <table className={`w-full border-collapse border border-gray-600 mb-4 last:mb-0 shadow-sm ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} {...props}>{children}</table>,
                  th: ({ children, ...props }) => <th className={`border border-gray-600 px-3 py-2 text-left font-semibold ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-100 text-gray-900'}`} {...props}>{children}</th>,
                  td: ({ children, ...props }) => <td className={`border border-gray-600 px-3 py-2 ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`} {...props}>{children}</td>,
                  input: ({ ...props }) => <input className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} type="checkbox" {...props} />,
                }}
              >
                {project.notes}
              </ReactMarkdown>
            </div>
          ) : (
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
              No notes available for this project.
            </p>
          )}
        </div>

        {/* Current Sprint Kanban Board */}
        <div className={`mb-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Current Sprint Tasks
            </h2>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sprint {project.current_sprint} of {project.num_sprints}
            </div>
          </div>
          
          {tasks.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
              {/* Todo Column */}
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center mb-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Todo
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({tasks.filter(task => task.status === 'todo' && task.sprint === project.current_sprint).length})
                    </span>
                  </h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'todo' && task.sprint === project.current_sprint)
                    .map(task => (
                      <div key={task.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 overflow-hidden`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                            task.type === 'bug' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center mb-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    In Progress
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({tasks.filter(task => task.status === 'in-progress' && task.sprint === project.current_sprint).length})
                    </span>
                  </h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'in-progress' && task.sprint === project.current_sprint)
                    .map(task => (
                      <div key={task.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 overflow-hidden`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                            task.type === 'bug' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Done Column */}
              <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center mb-4">
                  <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Done
                    <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      ({tasks.filter(task => task.status === 'done' && task.sprint === project.current_sprint).length})
                    </span>
                  </h3>
                </div>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status === 'done' && task.sprint === project.current_sprint)
                    .map(task => (
                      <div key={task.id} className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 overflow-hidden`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.type === 'feature' ? 'bg-blue-100 text-blue-800' :
                            task.type === 'bug' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p>No tasks found for the current sprint.</p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className={`mt-8 p-6 rounded-lg text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Interested in this project?
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            Create your own AI-powered project with Kanban AI
          </p>
          <a
            href="/"
            className={`inline-flex items-center px-6 py-3 rounded-md shadow-sm text-sm font-medium text-white
              bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700
              transition-all duration-200 ease-in-out`}
          >
            Get Started with Kanban AI
          </a>
        </div>
      </div>
    </div>
  );
} 