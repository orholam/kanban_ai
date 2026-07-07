import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as board from './boardService';

function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
  };
}

function toolError(message: string) {
  return textResult({ error: message });
}

export function registerKanbanMcpTools(server: McpServer): void {
  server.registerTool(
    'list_projects',
    {
      title: 'List Projects',
      description: 'List all Kanban AI projects the signed-in user can access.',
      inputSchema: {},
    },
    async () => {
      try {
        const projects = await board.listProjects();
        return textResult({ projects });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to list projects');
      }
    }
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
    async ({ project_id }) => {
      try {
        const json = await board.getBoardContextJson(project_id);
        return textResult(json);
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to load board');
      }
    }
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
    async (input) => {
      try {
        const project = await board.createProject(input);
        return textResult({ success: true, project });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to create project');
      }
    }
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
    async ({ project_id, ...updates }) => {
      try {
        const patch = Object.fromEntries(
          Object.entries(updates).filter(([, value]) => value !== undefined)
        );
        const project = await board.updateProject(project_id, patch);
        return textResult({ success: true, project });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to update project');
      }
    }
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
    async ({ project_id }) => {
      try {
        await board.deleteProject(project_id);
        return textResult({ success: true, project_id });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to delete project');
      }
    }
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
    async (input) => {
      try {
        const task = await board.createTask(input);
        return textResult({ success: true, task });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to create task');
      }
    }
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
    async ({ task_id, ...patch }) => {
      try {
        const updates = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
        const task = await board.updateTask(task_id, updates);
        return textResult({ success: true, task });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to update task');
      }
    }
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
    async ({ task_id }) => {
      try {
        await board.deleteTask(task_id);
        return textResult({ success: true, task_id });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to delete task');
      }
    }
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
    async ({ task_id }) => {
      try {
        const comments = await board.listTaskComments(task_id);
        return textResult({ comments });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to list comments');
      }
    }
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
    async (input) => {
      try {
        const comment = await board.addTaskComment(input);
        return textResult({ success: true, comment });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to add comment');
      }
    }
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
    async ({ comment_id }) => {
      try {
        await board.deleteTaskComment(comment_id);
        return textResult({ success: true, comment_id });
      } catch (err) {
        return toolError(err instanceof Error ? err.message : 'Failed to delete comment');
      }
    }
  );
}
