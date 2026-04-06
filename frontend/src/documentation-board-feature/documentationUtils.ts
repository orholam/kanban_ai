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
