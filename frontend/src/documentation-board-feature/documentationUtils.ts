import { DOCUMENTATION_CATEGORIES } from './documentationCategories';
import { DOCUMENTATION_ARTICLES } from './documentationArticles';
import type { DocumentationArticle, DocumentationCategoryId, DocumentationCategoryMeta } from './types';

export type { DocumentationArticle, DocumentationCategoryId, DocumentationCategoryMeta } from './types';

export function getDocumentationCategories(): DocumentationCategoryMeta[] {
  return [...DOCUMENTATION_CATEGORIES];
}

export function getAllDocumentationArticles(): DocumentationArticle[] {
  return [...DOCUMENTATION_ARTICLES].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getDocumentationArticleBySlug(slug: string): DocumentationArticle | undefined {
  return DOCUMENTATION_ARTICLES.find((a) => a.id === slug);
}

export function getDocumentationArticlesByCategory(categoryId: DocumentationCategoryId): DocumentationArticle[] {
  return DOCUMENTATION_ARTICLES.filter((a) => a.categoryId === categoryId).sort((a, b) => {
    if (a.navOrder !== b.navOrder) return a.navOrder - b.navOrder;
    return a.title.localeCompare(b.title);
  });
}

export function getDocumentationCategoryById(
  categoryId: DocumentationCategoryId,
): DocumentationCategoryMeta | undefined {
  return DOCUMENTATION_CATEGORIES.find((c) => c.id === categoryId);
}

export function getAllDocumentationTags(): string[] {
  const set = new Set<string>();
  DOCUMENTATION_ARTICLES.forEach((a) => a.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}

export interface DocumentationSearchResult {
  article: DocumentationArticle;
  categoryTitle: string;
}

function documentationSearchHaystack(article: DocumentationArticle): string {
  return [article.title, article.excerpt, ...article.tags, article.body].join(' ').toLowerCase();
}

function documentationSearchScore(article: DocumentationArticle, terms: string[]): number {
  const title = article.title.toLowerCase();
  const excerpt = article.excerpt.toLowerCase();
  const tagText = article.tags.join(' ').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 10;
    else if (excerpt.includes(term)) score += 5;
    else if (tagText.includes(term)) score += 3;
    else score += 1;
  }
  return score;
}

/** Case-insensitive substring search; all whitespace-separated terms must match. */
export function searchDocumentationArticles(query: string): DocumentationSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const matches = DOCUMENTATION_ARTICLES.filter((article) => {
    const haystack = documentationSearchHaystack(article);
    return terms.every((term) => haystack.includes(term));
  });

  return matches
    .map((article) => ({
      article,
      categoryTitle: getDocumentationCategoryById(article.categoryId)?.title ?? article.categoryId,
      score: documentationSearchScore(article, terms),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.article.navOrder !== b.article.navOrder) return a.article.navOrder - b.article.navOrder;
      return a.article.title.localeCompare(b.article.title);
    })
    .map(({ article, categoryTitle }) => ({ article, categoryTitle }));
}
