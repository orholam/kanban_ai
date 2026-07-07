/** Shared MCP client setup helpers (in-app Connect page + docs). */

export const MCP_TOOLS = [
  { name: 'list_projects', description: 'List all projects you can access' },
  { name: 'get_board', description: 'Load a project, tasks, and comments as JSON' },
  { name: 'create_project', description: 'Create a new project' },
  { name: 'update_project', description: 'Update project metadata or notes' },
  { name: 'delete_project', description: 'Delete a project and its tasks' },
  { name: 'create_task', description: 'Add a task to a board' },
  { name: 'update_task', description: 'Move or edit a task (status, title, sprint, etc.)' },
  { name: 'delete_task', description: 'Remove a task' },
  { name: 'list_task_comments', description: 'Read comments on a task' },
  { name: 'add_task_comment', description: 'Leave a note on a task' },
  { name: 'delete_task_comment', description: 'Delete a comment' },
] as const;

export const MCP_EXAMPLE_PROMPTS = [
  'List my projects and summarize what is in progress.',
  'On project {project_id}, move all in-progress tasks to done.',
  'Create a task: "Write MCP setup doc" with high priority in sprint 1.',
  'Show me blocked or overdue tasks across my active board.',
] as const;

export function getMcpEndpointUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/mcp`;
  }
  return 'https://kanbanai.dev/api/mcp';
}

export function buildCursorMcpConfig(input: {
  accessToken: string;
  mcpApiSecret?: string;
  endpointUrl?: string;
}): string {
  const url = input.endpointUrl ?? getMcpEndpointUrl();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${input.accessToken}`,
  };
  if (input.mcpApiSecret?.trim()) {
    headers['X-MCP-API-Key'] = input.mcpApiSecret.trim();
  }
  return JSON.stringify(
    {
      mcpServers: {
        'kanban-ai': {
          url,
          headers,
        },
      },
    },
    null,
    2
  );
}

export function buildMcpRemoteCommand(input: {
  accessToken: string;
  mcpApiSecret?: string;
  endpointUrl?: string;
}): string {
  const url = input.endpointUrl ?? getMcpEndpointUrl();
  const parts = ['npx', '-y', 'mcp-remote', url];
  if (input.mcpApiSecret?.trim()) {
    parts.push('--header', `X-MCP-API-Key:${input.mcpApiSecret.trim()}`);
  }
  parts.push('--header', `Authorization:Bearer ${input.accessToken}`);
  return parts.join(' ');
}

export function buildClaudeDesktopMcpConfig(input: {
  accessToken: string;
  mcpApiSecret?: string;
  endpointUrl?: string;
}): string {
  const url = input.endpointUrl ?? getMcpEndpointUrl();
  const args = ['-y', 'mcp-remote', url];
  if (input.mcpApiSecret?.trim()) {
    args.push('--header', `X-MCP-API-Key:${input.mcpApiSecret.trim()}`);
  }
  args.push('--header', `Authorization:Bearer ${input.accessToken}`);
  return JSON.stringify(
    {
      mcpServers: {
        'kanban-ai': {
          command: 'npx',
          args,
        },
      },
    },
    null,
    2
  );
}

export type McpClientSetup = {
  endpoint: string;
  cursorConfig: string;
  claudeConfig: string;
  tokenExpiresAt: number | null;
};

export function buildMcpClientSetup(input: {
  accessToken: string;
  mcpApiSecret?: string;
  endpointUrl: string;
  tokenExpiresAt?: number | null;
}): McpClientSetup {
  const { accessToken, mcpApiSecret, endpointUrl, tokenExpiresAt = null } = input;
  return {
    endpoint: endpointUrl,
    cursorConfig: buildCursorMcpConfig({ accessToken, mcpApiSecret, endpointUrl }),
    claudeConfig: buildClaudeDesktopMcpConfig({ accessToken, mcpApiSecret, endpointUrl }),
    tokenExpiresAt,
  };
}

export const MCP_DOCS_SLUG = 'connect-mcp-claude-cursor';

export type McpSetupResponse = {
  endpoint: string;
  cursorConfig: string;
  claudeConfig: string;
};

/** Load ready-to-paste MCP config from the server (includes API secret when configured). */
export async function fetchMcpSetup(accessToken: string): Promise<McpSetupResponse> {
  const res = await fetch('/api/mcp/setup', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Setup failed (${res.status})`);
  }
  return res.json() as Promise<McpSetupResponse>;
}
