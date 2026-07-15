/**
 * Public marketing/content routes to prerender after `vite build`.
 * Keep in sync with App.tsx public routes + blog JSON + documentation articles.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');

const STATIC_PUBLIC_ROUTES = [
  '/',
  '/login',
  '/waitlist',
  '/blog',
  '/docs',
  '/contact',
  '/connect',
  '/privacy-policy',
  '/terms-of-service',
];

function collectBlogSlugs() {
  const blogDir = path.join(frontendRoot, 'src/data/blog');
  return fs
    .readdirSync(blogDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));
}

function collectDocumentationSlugs() {
  const articlesPath = path.join(
    frontendRoot,
    'src/documentation-board-feature/documentationArticles.ts'
  );
  const source = fs.readFileSync(articlesPath, 'utf8');
  return [...source.matchAll(/^\s+id:\s*'([^']+)'/gm)].map((match) => match[1]);
}

export function collectPrerenderRoutes() {
  const routes = [
    ...STATIC_PUBLIC_ROUTES,
    ...collectBlogSlugs().map((slug) => `/blog/${slug}`),
    ...collectDocumentationSlugs().map((slug) => `/docs/${slug}`),
  ];
  return [...new Set(routes)];
}
