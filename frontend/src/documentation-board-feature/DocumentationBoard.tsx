import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { DOCUMENTATION_BOARD_BASE_PATH, documentationBoardArticlePath } from './integration';
import { getDocumentationCategories, getDocumentationArticlesByCategory } from './documentationUtils';
import DocumentationShell from './DocumentationShell';

interface DocumentationBoardProps {
  isDarkMode: boolean;
}

export default function DocumentationBoard({ isDarkMode }: DocumentationBoardProps) {
  const categories = getDocumentationCategories();

  return (
    <>
      <SEO
        title="Documentation — Kanban AI boards, AI planning & developer setup"
        description="Guides for guest mode, boards, AI chat, account & sharing, and running the open-source app locally."
        keywords="Kanban AI docs, kanban documentation, AI task management help, Supabase kanban, developer setup"
        url={`https://kanbanai.dev${DOCUMENTATION_BOARD_BASE_PATH}`}
      />
      <DocumentationShell isDarkMode={isDarkMode} layout="hub">
        <div>
          <h1 className={`mb-3 text-3xl font-bold tracking-tight sm:text-[2rem] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            Introduction
          </h1>
          <p className={`mb-8 max-w-2xl text-base leading-relaxed sm:text-[17px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            How the product works—guest try-first, signed-in sync, boards and AI—and how developers clone the repo and
            run <strong className="font-semibold">npm run dev:local</strong> (no cloud account required). Use the sidebar,
            or start with{' '}
            <Link
              to={documentationBoardArticlePath('overview')}
              className={`font-semibold underline decoration-2 underline-offset-[3px] transition-colors ${
                isDarkMode
                  ? 'text-indigo-400 decoration-indigo-500/40 hover:text-indigo-300'
                  : 'text-indigo-700 decoration-indigo-400/50 hover:text-indigo-900'
              }`}
            >
              What is Kanban AI?
            </Link>
            .
          </p>

          <h2 className={`mb-4 text-xs font-semibold uppercase tracking-[0.14em] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
            All sections
          </h2>
          <ul className="grid gap-4 sm:gap-5 xl:grid-cols-2 xl:gap-x-6">
            {categories.map((cat) => {
              const articles = getDocumentationArticlesByCategory(cat.id);
              return (
                <li key={cat.id}>
                  <div
                    className={`flex h-full flex-col rounded-xl border px-4 py-4 transition-shadow sm:px-5 sm:py-5 ${
                      isDarkMode
                        ? 'border-zinc-800 bg-zinc-900/50 shadow-sm shadow-black/20 hover:border-zinc-700'
                        : 'border-zinc-200/90 bg-white shadow-sm shadow-zinc-950/[0.04] hover:border-zinc-300 hover:shadow-md'
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <h3 className={`text-[15px] font-semibold leading-snug sm:text-base ${isDarkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
                        {cat.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {articles.length} {articles.length === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                      {cat.description}
                    </p>
                    <ul className={`mt-4 flex-1 space-y-0 ${isDarkMode ? 'divide-y divide-zinc-800/90' : 'divide-y divide-zinc-100'}`}>
                      {articles.map((article) => (
                        <li key={article.id}>
                          <Link
                            to={documentationBoardArticlePath(article.id)}
                            className={`group flex items-start justify-between gap-3 rounded-md py-2.5 text-sm transition-colors sm:py-2 ${
                              isDarkMode
                                ? 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                                : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                            }`}
                          >
                            <span className="min-w-0 flex-1 font-medium leading-snug">{article.title}</span>
                            <ArrowRight
                              className={`mt-0.5 h-4 w-4 shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 ${
                                isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                              }`}
                              aria-hidden
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className={`mt-10 rounded-lg border px-3 py-2.5 text-xs leading-relaxed sm:px-4 ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900/30 text-zinc-500' : 'border-zinc-200 bg-white text-zinc-500'
          }`}>
            Developer note: this section lives in{' '}
            <code className={`rounded px-1 py-px font-mono text-[11px] ${isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-100 text-zinc-700'}`}>
              frontend/src/documentation-board-feature
            </code>{' '}
            and can be removed as a unit when no longer needed.
          </p>
        </div>
      </DocumentationShell>
    </>
  );
}
