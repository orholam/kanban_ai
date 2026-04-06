/** All types for the documentation board live in this folder. */

export type DocumentationCategoryId =
  | 'getting-started'
  | 'workspace'
  | 'ai'
  | 'account'
  | 'developers';

export interface DocumentationArticle {
  id: string;
  categoryId: DocumentationCategoryId;
  /** Lower sorts first within the section (sidebar / index). */
  navOrder: number;
  title: string;
  excerpt: string;
  estimatedMinutes: number;
  tags: string[];
  date: string;
  author: string;
  body: string;
}

export interface DocumentationCategoryMeta {
  id: DocumentationCategoryId;
  title: string;
  description: string;
}
