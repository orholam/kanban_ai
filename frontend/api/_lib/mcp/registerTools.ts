import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as board from './boardService.js';
import { recordMcpToolCall } from './analytics.js';
import { getMcpContext } from './requestContext.js';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
};

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const createAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

const updateAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

function textResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  };
}

function toolError(message: string): ToolResult {
  return textResult({ error: message });
}

function extractProjectId(args: Record<string, unknown>): string | undefined {
  const id = args.project_id;
  return typeof id === 'string' ? id : undefined;
}

async function runTool<T extends Record<string, unknown>>(
  toolName: string,
  args: T,
  fn: () => Promise<ToolResult>
): Promise<ToolResult> {
  const started = Date.now();
  const { userId } = getMcpContext();
  let success = false;
  let errorMessage: string | undefined;

  try {
    const result = await fn();
    const text = result.content[0]?.text ?? '';
    success = !text.includes('"error"');
    if (!success) {
      try {
        const parsed = JSON.parse(text) as { error?: string };
        errorMessage = parsed.error;
      } catch {
        errorMessage = 'tool returned error';
      }
    }
    return result;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'tool failed';
    return toolError(errorMessage);
  } finally {
    void recordMcpToolCall({
      toolName,
      userId,
      success,
      durationMs: Date.now() - started,
      error: errorMessage,
      projectId: extractProjectId(args),
    });
  }
}

/**
 * Remote MCP surface for agents. Hard-delete of projects, tasks, and comments stays
 * in the signed-in web app so autonomous clients cannot irreversibly destroy boards.
 */
export function registerKanbanMcpTools(server: McpServer): void {
  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description:
        'Read-only listing of Kanban AI projects the authenticated user can access. Returns titles and ids only. Does not modify any data.',
      inputSchema: {},
      annotations: readOnlyAnnotations,
    },
    async () =>
      runTool('list_projects', {}, async () => {
        const projects = await board.listProjects();
        return textResult({ projects });
      })
  );

  server.registerTool(
    'get_board',
    {
      title: 'Get Board',
      description:
<<<<<<< Updated upstream
        'Get a project and its tasks as JSON context. Optionally filter by sprint and omit comments for large boards.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
        sprint: z.number().int().min(1).optional().describe('Return only tasks in this sprint'),
        include_comments: z
          .boolean()
          .optional()
          .describe('Include task comments (defaults to true; disable for large boards)'),
=======
        'Read-only snapshot of one project the authenticated user can access, including its tasks and comments as JSON. Does not modify any data.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID the authenticated user can access'),
>>>>>>> Stashed changes
      },
      annotations: readOnlyAnnotations,
    },
    async ({ project_id, sprint, include_comments }) =>
      runTool('get_board', { project_id, sprint, include_comments }, async () => {
        const json = await board.getBoardContextJson(project_id, {
          sprint,
          includeComments: include_comments ?? true,
        });
        return textResult(json);
      })
  );

  server.registerTool(
    'create_project',
    {
      title: 'Create Project',
      description:
        'Create a new Kanban AI project owned by the authenticated user. Scoped to that account. Fields can be changed later with update_project.',
      inputSchema: {
        title: z.string().min(1),
        description: z.string().min(1),
        projectType: z.string().optional(),
        num_sprints: z.number().int().min(1).max(52).optional(),
        private: z.boolean().optional(),
        master_plan: z.string().optional(),
        initial_prompt: z.string().optional(),
        keywords: z.string().optional(),
        notes: z.string().optional(),
      },
      annotations: createAnnotations,
    },
    async (input) =>
      runTool('create_project', input, async () => {
        const project = await board.createProject(input);
        return textResult({ success: true, project });
      })
  );

  server.registerTool(
    'update_project',
    {
      title: 'Update Project',
      description:
        'Update metadata on a Kanban AI project the authenticated user already belongs to (title, notes, privacy, sprint fields). Applies only to that project; a later update_project call can change the same fields again.',
      inputSchema: {
        project_id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        master_plan: z.string().optional(),
        initial_prompt: z.string().optional(),
        keywords: z.string().optional(),
        projectType: z.string().optional(),
        num_sprints: z.number().int().optional(),
        current_sprint: z.number().int().optional(),
        due_date: z.string().optional(),
        achievements: z.string().optional(),
        complete: z.boolean().optional(),
        private: z.boolean().optional(),
        notes: z.string().optional(),
      },
      annotations: updateAnnotations,
    },
    async ({ project_id, ...updates }) =>
      runTool('update_project', { project_id, ...updates }, async () => {
        const patch = Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined)
        );
        const project = await board.updateProject(project_id, patch);
        return textResult({ success: true, project });
      })
  );

  server.registerTool(
    'create_task',
    {
      title: 'Create Task',
      description:
        'Create a task card on a project board the authenticated user already belongs to. Status, priority, and other fields can be changed later with update_task.',
      inputSchema: {
        project_id: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(['bug', 'feature', 'scope']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        status: z.enum(['todo', 'in-progress', 'done']).optional(),
        sprint: z.number().int().optional(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
      annotations: createAnnotations,
    },
    async (input) =>
      runTool('create_task', input, async () => {
        const task = await board.createTask(input);
        return textResult({ success: true, task });
      })
  );

  server.registerTool(
    'update_task',
    {
      title: 'Update Task',
      description:
        'Update fields on an existing task the authenticated user can access (title, description, type, priority, status, sprint, due date). Status may be todo, in-progress, or done. A later update_task call can change the same fields again.',
      inputSchema: {
        task_id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        type: z.enum(['bug', 'feature', 'scope']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        status: z.enum(['todo', 'in-progress', 'done']).optional(),
        sprint: z.number().int().optional(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      },
      annotations: updateAnnotations,
    },
    async ({ task_id, ...patch }) =>
      runTool('update_task', { task_id, ...patch }, async () => {
        const updates = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
        const task = await board.updateTask(task_id, updates);
        return textResult({ success: true, task });
      })
  );

  server.registerTool(
    'list_task_comments',
    {
      title: 'List Task Comments',
      description:
        'Read-only listing of comments on a task the authenticated user can access. Does not modify any data.',
      inputSchema: {
        task_id: z.string().uuid(),
      },
      annotations: readOnlyAnnotations,
    },
    async ({ task_id }) =>
      runTool('list_task_comments', { task_id }, async () => {
        const comments = await board.listTaskComments(task_id);
        return textResult({ comments });
      })
  );

  server.registerTool(
    'add_task_comment',
    {
      title: 'Add Task Comment',
      description:
        'Append a comment to a task thread the authenticated user can access. Comments are additive notes on the card.',
      inputSchema: {
        task_id: z.string().uuid(),
        body: z.string().min(1),
        author_display_name: z.string().optional(),
      },
      annotations: createAnnotations,
    },
    async (input) =>
      runTool('add_task_comment', input, async () => {
        const comment = await board.addTaskComment(input);
        return textResult({ success: true, comment });
      })
  );
}
