import { useParams, Link, Navigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { getDocumentationArticleBySlug, getDocumentationCategoryById } from './documentationUtils';
import SEO from '../components/SEO';
import { DEFAULT_OG_IMAGE } from '../lib/siteMeta';
import { format } from 'date-fns';
import { DOCUMENTATION_BOARD_BASE_PATH, documentationBoardArticlePath } from './integration';
import DocMarkdown from './DocMarkdown';
import DocumentationShell from './DocumentationShell';

interface DocumentationArticlePageProps {
  isDarkMode: boolean;
}

export default function DocumentationArticlePage({ isDarkMode }: DocumentationArticlePageProps) {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? getDocumentationArticleBySlug(slug) : undefined;

  if (!doc) {
    return <Navigate to={DOCUMENTATION_BOARD_BASE_PATH} replace />;
  }

  const category = getDocumentationCategoryById(doc.categoryId);
  const publishedIso = new Date(`${doc.date}T12:00:00.000Z`).toISOString();

  const crumbMuted = isDarkMode ? 'text-zinc-500' : 'text-zinc-500';
  const crumbLink = isDarkMode
    ? 'text-zinc-400 hover:text-zinc-200'
    : 'text-zinc-600 hover:text-zinc-900';

  return (
    <>
      <SEO
        title={`${doc.title} | Kanban AI Docs`}
        description={doc.excerpt}
        keywords={[...doc.tags, 'Kanban AI', 'documentation'].join(', ')}
        url={`https://kanbanai.dev${documentationBoardArticlePath(doc.id)}`}
        type="article"
        author={doc.author}
        publishedTime={publishedIso}
        modifiedTime={publishedIso}
        section="Documentation"
        tags={doc.tags}
        image={DEFAULT_OG_IMAGE}
      />
      <DocumentationShell isDarkMode={isDarkMode} layout="article">
        <nav
          aria-label="Breadcrumb"
          className={`mb-7 flex flex-wrap items-center gap-x-1 gap-y-1 rounded-lg px-2.5 py-2 text-[13px] sm:text-sm ${
            isDarkMode ? 'bg-zinc-900/60 text-zinc-500' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/[0.04] ring-1 ring-zinc-200/80'
          }`}
        >
          <Link to={DOCUMENTATION_BOARD_BASE_PATH} className={`${crumbLink} font-medium`}>
            Docs
          </Link>
          {category && (
            <>
              <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
              <span className={`max-w-[12rem] truncate sm:max-w-none ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {category.title}
              </span>
            </>
          )}
          <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
          <span className={`line-clamp-2 min-w-0 flex-1 font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-800'}`}>
            {doc.title}
          </span>
        </nav>

        <article>
          <h1 className={`mb-4 text-3xl font-bold tracking-tight sm:text-[2.125rem] sm:leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
            {doc.title}
          </h1>

          <div
            className={`mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}
          >
            <time dateTime={doc.date} className="tabular-nums">
              Updated {format(new Date(doc.date), 'MMM d, yyyy')}
            </time>
            <span
              aria-hidden
              className={`hidden h-1 w-1 rounded-full sm:inline-block ${isDarkMode ? 'bg-zinc-600' : 'bg-zinc-300'}`}
            />
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 opacity-80" aria-hidden />
              {doc.estimatedMinutes} min read
            </span>
          </div>

          <p
            className={`mb-9 rounded-r-lg border-l-[3px] py-1 pl-4 pr-1 text-base leading-relaxed sm:py-1.5 sm:pl-5 sm:text-[17px] ${
              isDarkMode
                ? 'border-indigo-500/70 bg-indigo-500/[0.07] text-zinc-300'
                : 'border-indigo-500/80 bg-indigo-50/60 text-zinc-700'
            }`}
          >
            {doc.excerpt}
          </p>

          <DocMarkdown isDarkMode={isDarkMode} markdown={doc.body} />

          <footer className={`mt-12 border-t pt-6 sm:mt-14 sm:pt-8 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <p className={`text-xs leading-relaxed sm:text-[13px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Questions or corrections? Use{' '}
              <Link
                to="/feedback"
                className={`font-medium underline underline-offset-2 ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-700 hover:text-indigo-900'}`}
              >
                Feedback
              </Link>{' '}
              (sign in) or see the FAQ in the sidebar.
            </p>
          </footer>
        </article>
      </DocumentationShell>
    </>
  );
}
