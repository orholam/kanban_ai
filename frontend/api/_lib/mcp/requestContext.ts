import { AsyncLocalStorage } from 'node:async_hooks';
import type { McpAuthContext } from './auth';

export const mcpRequestContext = new AsyncLocalStorage<McpAuthContext>();

export function getMcpContext(): McpAuthContext {
  const ctx = mcpRequestContext.getStore();
  if (!ctx) {
    throw new Error('MCP request context is not available.');
  }
  return ctx;
}
