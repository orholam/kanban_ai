// Import all blog posts
import top5FreePost from '../data/blog/top-5-free-kanban-boards.json';
import smallTeamsPost from '../data/blog/best-kanban-tools-for-small-teams.json';
import kanbanVsScrumPost from '../data/blog/kanban-vs-scrum-tools.json';
import enterprisePost from '../data/blog/enterprise-kanban-solutions.json';
import openSourcePost from '../data/blog/open-source-kanban-alternatives.json';
import mobileAppsPost from '../data/blog/mobile-kanban-apps-comparison.json';
import stampAiEmailPost from '../data/blog/stamp-ai-native-email.json';
import kanbanAiV01LaunchPost from '../data/blog/kanbanai-v0-1-launch.json';
import clickCrisisPost from '../data/blog/click-crisis-project-management-tools.json';
import finishSideProjectSummerPost from '../data/blog/finish-side-project-summer-ai-kanban.json';
import kanbanMcpToolsComparedPost from '../data/blog/kanban-mcp-tools-compared.json';
import bestKanbanToolsWithMcp2026Post from '../data/blog/best-kanban-tools-with-mcp-2026.json';
import bestAiProjectManagementToolsSideProjectsPost from '../data/blog/best-ai-project-management-tools-side-projects.json';
import llmoAiToolDiscoverabilityPost from '../data/blog/llmo-ai-tool-discoverability-2026.json';
import aiKanbanBoardGuidePost from '../data/blog/ai-kanban-board-guide-2026.json';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  body: string;
  featuredImage?: string;
  /** Optional FAQ pairs for FAQPage JSON-LD (often overlooked SEO). */
  faqs?: { question: string; answer: string }[];
}

// Array of all blog posts
const allPosts: BlogPost[] = [
  top5FreePost as BlogPost,
  smallTeamsPost as BlogPost,
  kanbanVsScrumPost as BlogPost,
  enterprisePost as BlogPost,
  openSourcePost as BlogPost,
  mobileAppsPost as BlogPost,
  stampAiEmailPost as BlogPost,
  kanbanAiV01LaunchPost as BlogPost,
  clickCrisisPost as BlogPost,
  finishSideProjectSummerPost as BlogPost,
  kanbanMcpToolsComparedPost as BlogPost,
  bestKanbanToolsWithMcp2026Post as BlogPost,
  bestAiProjectManagementToolsSideProjectsPost as BlogPost,
  llmoAiToolDiscoverabilityPost as BlogPost,
  aiKanbanBoardGuidePost as BlogPost,
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

/**
 * Related posts by shared tags (excludes current). Used for internal linking blocks.
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPostBySlug(slug);
  if (!current) return [];

  const scored = allPosts
    .filter((post) => post.id !== current.id)
    .map((post) => {
      const overlap = post.tags.filter((tag) => current.tags.includes(tag)).length;
      return { post, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    });

  return scored.slice(0, limit).map(({ post }) => post);
}

