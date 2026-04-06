import { NavLink, Link } from 'react-router-dom';
import { BookOpen, ChevronRight, FileText } from 'lucide-react';
import { DOCUMENTATION_BOARD_BASE_PATH, documentationBoardArticlePath } from './integration';
import { getDocumentationCategories, getDocumentationArticlesByCategory } from './documentationUtils';

interface DocumentationShellProps {
  isDarkMode: boolean;
  children: React.ReactNode;
  /** Wider main column for the docs index; articles stay in a comfortable reading measure. */
  layout?: 'article' | 'hub';
}

function sidebarLinkClass(isDarkMode: boolean, isActive: boolean): string {
  const base =
    '-mr-px block border-l-[3px] py-1.5 pl-3 pr-2 text-[13px] leading-snug transition-colors';
  if (isActive) {
    return `${base} border-indigo-500 font-medium ${
      isDarkMode ? 'bg-indigo-500/[0.12] text-white' : 'bg-indigo-50 text-indigo-950'
    }`;
  }
  return `${base} border-transparent ${
    isDarkMode
      ? 'text-zinc-400 hover:border-zinc-600 hover:bg-white/[0.04] hover:text-zinc-100'
      : 'text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100/90 hover:text-zinc-900'
  }`;
}

export default function DocumentationShell({
  isDarkMode,
  children,
  layout = 'article',
}: DocumentationShellProps) {
  const categories = getDocumentationCategories();

  const mainMax =
    layout === 'hub'
      ? 'max-w-[72rem]'
      : 'max-w-[42rem] xl:max-w-[44rem]';

  return (
    <div
      className={`flex min-h-full w-full flex-col ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col lg:min-h-[calc(100vh-4rem)] lg:flex-row">
        <aside
          className={`relative shrink-0 border-b lg:w-[15.25rem] lg:border-b-0 lg:border-r lg:shadow-[1px_0_0_0_rgba(0,0,0,0.06)] dark:lg:shadow-[1px_0_0_0_rgba(255,255,255,0.06)] ${
            isDarkMode ? 'border-zinc-800 bg-zinc-950 lg:bg-zinc-950/98' : 'border-zinc-200/80 bg-white lg:bg-white'
          }`}
          aria-label="Documentation"
        >
          <div className="sticky top-0 z-[1] max-h-none overflow-y-auto overscroll-contain px-3 py-5 sm:px-4 sm:py-6 lg:max-h-[calc(100vh-4rem)] lg:px-3 lg:py-7 xl:px-4">
            <div className="mb-5 flex items-center gap-2.5 border-b border-transparent pb-4 lg:mb-6">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isDarkMode ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <FileText className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <span
                  className={`block text-sm font-semibold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}
                >
                  Documentation
                </span>
                <span className={`text-[11px] font-medium ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Kanban AI
                </span>
              </div>
            </div>

            <nav className="space-y-0.5">
              <NavLink
                to={DOCUMENTATION_BOARD_BASE_PATH}
                end
                className={({ isActive }) => sidebarLinkClass(isDarkMode, isActive)}
              >
                Introduction
              </NavLink>
            </nav>

            {categories.map((cat, index) => {
              const articles = getDocumentationArticlesByCategory(cat.id);
              return (
                <div
                  key={cat.id}
                  className={
                    index === 0
                      ? 'mt-5 lg:mt-6'
                      : `mt-6 border-t pt-6 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`
                  }
                >
                  <p
                    className={`mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      isDarkMode ? 'text-zinc-500' : 'text-zinc-500'
                    }`}
                  >
                    {cat.title}
                  </p>
                  <ul className="space-y-px">
                    {articles.map((article) => (
                      <li key={article.id}>
                        <NavLink
                          to={documentationBoardArticlePath(article.id)}
                          className={({ isActive }) => sidebarLinkClass(isDarkMode, isActive)}
                        >
                          {article.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            <div
              className={`mt-8 border-t pt-5 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
            >
              <Link
                to="/blog"
                className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium transition-colors ${
                  isDarkMode
                    ? 'text-zinc-400 hover:bg-white/[0.04] hover:text-indigo-400'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-indigo-700'
                }`}
              >
                <BookOpen className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span className="flex-1">Product blog</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" />
              </Link>
            </div>
          </div>
        </aside>

        <div
          className={`min-w-0 flex-1 ${isDarkMode ? 'bg-zinc-950' : 'bg-zinc-50'}`}
        >
          <div className="flex w-full justify-center px-4 py-7 sm:px-6 sm:py-8 lg:px-8 lg:py-9 xl:px-10 xl:py-10">
            <div className={`w-full ${mainMax}`}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
