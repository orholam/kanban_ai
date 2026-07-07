import { Link } from 'react-router-dom';
import { ArrowRight, Search, X } from 'lucide-react';
import { documentationBoardArticlePath } from './integration';
import { searchDocumentationArticles } from './documentationUtils';

interface DocumentationSearchInputProps {
  isDarkMode: boolean;
  query: string;
  onQueryChange: (query: string) => void;
}

export function DocumentationSearchInput({
  isDarkMode,
  query,
  onQueryChange,
}: DocumentationSearchInputProps) {
  return (
    <div className="mb-5 lg:mb-6">
      <label htmlFor="docs-search" className="sr-only">
        Search documentation
      </label>
      <div className="relative">
        <Search
          className={`pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 ${
            isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
          }`}
          aria-hidden
        />
        <input
          id="docs-search"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search docs…"
          autoComplete="off"
          className={`w-full rounded-lg border py-2 pl-9 pr-9 text-[13px] leading-snug outline-none transition-colors placeholder:font-normal ${
            isDarkMode
              ? 'border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20'
              : 'border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15'
          }`}
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition-colors ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
            }`}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface DocumentationSearchResultsProps {
  isDarkMode: boolean;
  query: string;
  onNavigate: () => void;
}

export function DocumentationSearchResults({
  isDarkMode,
  query,
  onNavigate,
}: DocumentationSearchResultsProps) {
  const results = searchDocumentationArticles(query);
  const trimmed = query.trim();

  return (
    <div>
      <h1
        className={`mb-2 text-3xl font-bold tracking-tight sm:text-[2rem] ${
          isDarkMode ? 'text-white' : 'text-zinc-900'
        }`}
      >
        Search
      </h1>
      <p className={`mb-8 text-base leading-relaxed sm:text-[17px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
        {results.length === 0 ? (
          <>No articles match &ldquo;{trimmed}&rdquo;.</>
        ) : (
          <>
            {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{trimmed}&rdquo;
          </>
        )}
      </p>

      {results.length === 0 ? (
        <div
          className={`rounded-xl border px-5 py-8 text-center ${
            isDarkMode ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-600'
          }`}
        >
          <Search
            className={`mx-auto mb-3 h-8 w-8 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}`}
            aria-hidden
          />
          <p className="text-sm leading-relaxed">
            Try different keywords, or browse sections in the sidebar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {results.map(({ article, categoryTitle }) => (
            <li key={article.id}>
              <Link
                to={documentationBoardArticlePath(article.id)}
                onClick={onNavigate}
                className={`group flex items-start justify-between gap-4 rounded-xl border px-4 py-4 transition-shadow sm:px-5 sm:py-5 ${
                  isDarkMode
                    ? 'border-zinc-800 bg-zinc-900/50 shadow-sm shadow-black/20 hover:border-zinc-700'
                    : 'border-zinc-200/90 bg-white shadow-sm shadow-zinc-950/[0.04] hover:border-zinc-300 hover:shadow-md'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={`mb-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {categoryTitle}
                  </span>
                  <h2
                    className={`text-[15px] font-semibold leading-snug sm:text-base ${
                      isDarkMode ? 'text-zinc-100' : 'text-zinc-900'
                    }`}
                  >
                    {article.title}
                  </h2>
                  <p className={`mt-1.5 text-sm leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>
                    {article.excerpt}
                  </p>
                </div>
                <ArrowRight
                  className={`mt-1 h-4 w-4 shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
