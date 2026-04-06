import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const SESSION_KEY = 'kanban-chunk-retry';

/**
 * Wraps a dynamic import like `React.lazy` but recovers when the chunk is missing or invalid
 * (common right after a deploy while a tab still has an old JS shell).
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
      return mod;
    } catch {
      if (typeof window === 'undefined') {
        throw new Error('Dynamic import failed');
      }
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') {
        throw new Error('Application failed to load after refresh');
      }
      window.sessionStorage.setItem(SESSION_KEY, '1');
      window.location.reload();
      return new Promise(() => {}) as Promise<{ default: T }>;
    }
  });
}
