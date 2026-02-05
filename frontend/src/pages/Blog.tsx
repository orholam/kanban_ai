import { Link } from 'react-router-dom';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import { getAllPosts } from '../lib/blogUtils';
import SEO from '../components/SEO';
import { format } from 'date-fns';

interface BlogProps {
  isDarkMode: boolean;
}

export default function Blog({ isDarkMode }: BlogProps) {
  const posts = getAllPosts();

  return (
    <>
      <SEO 
        title="Blog - Kanban AI"
        description="Explore our blog posts about kanban software, project management tools, and productivity tips. Compare Trello, Asana, Jira, Monday.com, Notion, Linear, and more."
        keywords="blog, kanban, project management, productivity, software comparison, trello, asana, jira"
        url="https://kanbanai.dev/blog"
      />
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Blog
            </h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Explore kanban software comparisons, project management insights, and productivity tips.
            </p>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className={`group block rounded-lg border transition-all duration-200 hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                    : 'bg-white border-gray-200 hover:border-indigo-500'
                }`}
              >
                <div className="p-6">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDarkMode
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Title */}
                  <h2
                    className={`text-xl font-semibold mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p
                    className={`text-sm mb-4 line-clamp-3 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm">
                    <div className={`flex items-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Calendar className="w-4 h-4 mr-1.5" />
                      <time dateTime={post.date}>
                        {format(new Date(post.date), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <div
                      className={`flex items-center font-medium group-hover:translate-x-1 transition-transform ${
                        isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                      }`}
                    >
                      Read more
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {posts.length === 0 && (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p>No blog posts available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

