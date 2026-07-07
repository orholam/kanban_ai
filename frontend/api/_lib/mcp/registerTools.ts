import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as board from './boardService.js';
import { recordMcpToolCall } from './analytics.js';
import { getMcpContext } from './requestContext.js';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
};

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

export function registerKanbanMcpTools(server: McpServer): void {
  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description: 'List all Kanban AI projects the signed-in user can access.',
      inputSchema: {},
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
      description: 'Get a project and all of its tasks (with task comments) as JSON context.',
      inputSchema: {
        project_id: z.string().uuid().describe('Project UUID'),
      },
    },
    async ({ project_id }) =>
      runTool('get_board', { project_id }, async () => {
        const json = await board.getBoardContextJson(project_id);
        return textResult(json);
      })
  );

  server.registerTool(
    'create_project',
    {
      title: 'Create Project',
      description: 'Create a new Kanban AI project for the signed-in user.',
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
      description: 'Update project metadata (title, notes, privacy, sprint fields, etc.).',
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
    'delete_project',
    {
      title: 'Delete Project',
      description: 'Delete a project and all of its tasks and collaborator rows.',
      inputSchema: {
        project_id: z.string().uuid(),
      },
    },
    async ({ project_id }) =>
      runTool('delete_project', { project_id }, async () => {
        await board.deleteProject(project_id);
        return textResult({ success: true, project_id });
      })
  );

  server.registerTool(
    'create_task',
    {
      title: 'Create Task',
      description: 'Create a task on a project board.',
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
      description: 'Update an existing task by id.',
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
    },
    async ({ task_id, ...patch }) =>
      runTool('update_task', { task_id, ...patch }, async () => {
        const updates = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
        const task = await board.updateTask(task_id, updates);
        return textResult({ success: true, task });
      })
  );

  server.registerTool(
    'delete_task',
    {
      title: 'Delete Task',
      description: 'Delete a task from a board.',
      inputSchema: {
        task_id: z.string().uuid(),
      },
    },
    async ({ task_id }) =>
      runTool('delete_task', { task_id }, async () => {
        await board.deleteTask(task_id);
        return textResult({ success: true, task_id });
      })
  );

  server.registerTool(
    'list_task_comments',
    {
      title: 'List Task Comments',
      description: 'List comments on a task.',
      inputSchema: {
        task_id: z.string().uuid(),
      },
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
      description: 'Add a comment to a task thread.',
      inputSchema: {
        task_id: z.string().uuid(),
        body: z.string().min(1),
        author_display_name: z.string().optional(),
      },
    },
    async (input) =>
      runTool('add_task_comment', input, async () => {
        const comment = await board.addTaskComment(input);
        return textResult({ success: true, comment });
      })
  );

  server.registerTool(
    'delete_task_comment',
    {
      title: 'Delete Task Comment',
      description: 'Delete a task comment by id.',
      inputSchema: {
        comment_id: z.string().uuid(),
      },
    },
    async ({ comment_id }) =>
      runTool('delete_task_comment', { comment_id }, async () => {
        await board.deleteTaskComment(comment_id);
        return textResult({ success: true, comment_id });
      })
  );
}
