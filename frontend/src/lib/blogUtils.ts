// Import all blog posts
import top5FreePost from '../data/blog/top-5-free-kanban-boards.json';
import smallTeamsPost from '../data/blog/best-kanban-tools-for-small-teams.json';
import kanbanVsScrumPost from '../data/blog/kanban-vs-scrum-tools.json';
import enterprisePost from '../data/blog/enterprise-kanban-solutions.json';
import openSourcePost from '../data/blog/open-source-kanban-alternatives.json';
import mobileAppsPost from '../data/blog/mobile-kanban-apps-comparison.json';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  body: string;
  featuredImage?: string;
}

// Array of all blog posts
const allPosts: BlogPost[] = [
  top5FreePost as BlogPost,
  smallTeamsPost as BlogPost,
  kanbanVsScrumPost as BlogPost,
  enterprisePost as BlogPost,
  openSourcePost as BlogPost,
  mobileAppsPost as BlogPost,
];

/**
 * Get all blog posts, sorted by date (newest first)
 */
export function getAllPosts(): BlogPost[] {
  return [...allPosts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Get a single blog post by slug/id
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find(post => post.id === slug);
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPost[] {
  return allPosts.filter(post => post.tags.includes(tag));
}

/**
 * Get all unique tags from all posts
 */
export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  allPosts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

