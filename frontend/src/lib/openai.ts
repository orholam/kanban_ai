import { getPromptsForProjectType } from './prompts';
import type { Task } from '../types';

/** Browser calls this; Vercel serverless adds OPENAI_API_KEY and forwards to OpenAI. */
const OPENAI_PROXY_URL = '/api/openai';

export async function getOpenAiProxyConfigured(): Promise<boolean> {
  try {
    const r = await fetch(OPENAI_PROXY_URL, { method: 'GET' });
    if (!r.ok) return false;
    const j = (await r.json()) as { configured?: boolean };
    return Boolean(j.configured);
  } catch {
    return false;
  }
}

async function postViaOpenAiProxy(body: object): Promise<Response> {
  return fetch(OPENAI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

interface OpenAIRequest {
  model: string;
  messages: Record<string, unknown>[];
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  function_call?: string;
  stream?: boolean;
}

interface OpenAIResponse {
  choices: {
    message: {
      role: string;
      content: string | null;
      function_call?: {
        name: string;
        arguments: string;
      };
      tool_calls?: Array<{
        id: string;
        type?: string;
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }[];
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'create_project_plan',
      description: 'Create a detailed development plan for the project.',
      parameters: {
        type: 'object',
        properties: {
          weeks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['title', 'description'],
            },
            minItems: 1,
          },
        },
        required: ['weeks'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project_tasks',
      description: 'Create a list of tasks for the first week of the project.',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                type: { type: 'string', enum: ['feature', 'scope', 'bug'] },
              },
              required: ['title', 'description', 'priority', 'type'],
            },
            minItems: 1,
          },
        },
        required: ['tasks'],
        additionalProperties: false,
      },
    },
  },
];
const tools2 = [
  {
    type: 'function',
    function: {
      name: 'create_project_tasks',
      description: 'Create a list of tasks for the first week of the project.',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                type: { type: 'string', enum: ['feature', 'scope', 'bug'] },
              },
              required: ['title', 'description', 'priority', 'type'],
            },
            minItems: 1,
          },
        },
        required: ['tasks'],
        additionalProperties: false,
      },
    },
  },
];

export async function generateProjectPlan(
  projectDetails: { name: string; keywords: string[]; description: string; projectType: string }
): Promise<OpenAIResponse> {
  const prompts = getPromptsForProjectType(projectDetails.projectType);

  const prompt = `
    ${prompts.projectPlan}
    Project name: "${projectDetails.name}".
    Selected dev tools: ${projectDetails.keywords.join(', ')}.
    Web app description: ${projectDetails.description}.
  `;

  const requestBody: OpenAIRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
    tools,
  };

  const response = await postViaOpenAiProxy(requestBody);

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data;
}

export async function generateFirstWeekTasks(projectPlan: string, projectType: string): Promise<OpenAIResponse> {
  const prompts = getPromptsForProjectType(projectType);

  const prompt = `
    ${prompts.firstWeekTasks}
    ${projectPlan}
  `;

  const requestBody: OpenAIRequest = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
    tools: tools2,
  };

  const response = await postViaOpenAiProxy(requestBody);

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }
  const data = (await response.json()) as OpenAIResponse;
  return data;
}

// Note: Should have an external memory store which cycles through tech information
// Some should be sticky - the prompt should always include basic knowledge of LLMs, function calling, modern tools, etc.
// Other information should cycle through - tech headlines, so users can take advantage of the cutting edge tools.

export async function generateProjectOverview(
  projectDetails: { name: string; keywords: string[]; description: string; projectType: string }
): Promise<ReadableStream<Uint8Array> | null> {
  const prompts = getPromptsForProjectType(projectDetails.projectType);

  const prompt = `
    ${prompts.projectOverview}
    Create a high-level project overview for "${projectDetails.name}".
    This project will use: ${projectDetails.keywords.join(', ')}.
    Project description: ${projectDetails.description}

    Some background information on vibe coding tools:
    - All major LLMs now support function calling
    - Bolt.new, Loveable, and V0 are the top new prompt -> app tools, which work well for frontend as a starting pointbut also integrate well with supabase for backend.
    - Cursor and Windsurf are popular coding assistants (like Copilot) IDEs
    - Supabase is a popular new database tool that supports Postgresql, storage, and auth.

    Some recent developments from past month that may be useful - only include if relevant to the project!!!:
    - Play AI, Hume and Elevenlabs best voice models
    - Crew, MCP, OpenAI Agent SDK, and more - great agent frameworks

    The total length of your response should be 1-2 paragraphs.
  `;

  const requestBody = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
    stream: true,
  };

  const response = await postViaOpenAiProxy(requestBody);

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  return response.body;
}

const KANBAN_COMMENT_AI_MODEL = 'gpt-4o-mini' as const;

export type KanbanTaskCommentContext = {
  title: string;
  description: string;
  status: string;
  sprint: number;
  dueDate: string;
  type: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

export type KanbanCommentThreadTurn = {
  author: string;
  body: string;
};

/** Reply for @kanban mentions in the task modal comment box (same user row in DB; UI shows KanbanAI). */
export async function generateKanbanTaskCommentReply(params: {
  task: KanbanTaskCommentContext;
  thread: KanbanCommentThreadTurn[];
  userMessage: string;
}): Promise<string> {
  const question = params.userMessage.replace(/@kanban\b/gi, '').replace(/\s+/g, ' ').trim();
  const userAsk =
    question.length > 0
      ? question
      : 'Briefly summarize this task and suggest concrete next steps.';

  const taskBlock = [
    `Title: ${params.task.title}`,
    `Status: ${params.task.status}`,
    `Sprint: ${params.task.sprint}`,
    `Due: ${params.task.dueDate}`,
    `Type: ${params.task.type}`,
    `Priority: ${params.task.priority}`,
    `Created: ${params.task.createdAt || '(unknown)'}`,
    `Last updated: ${params.task.updatedAt || '(unknown)'}`,
    `Description:\n${params.task.description || '(none)'}`,
  ].join('\n');

  const threadText =
    params.thread.length === 0
      ? '(No prior comments.)'
      : params.thread.map((t) => `${t.author}: ${t.body}`).join('\n---\n');

  const system = `You are KanbanAI, a concise assistant inside a task card's comment thread.
Use the task details and comment history. If something is unknown, say so.
Reply in plain text (no markdown headings). Keep answers focused and actionable unless the user asks for depth.`;

  const userContent = `TASK:\n${taskBlock}\n\nCOMMENT THREAD (oldest to newest):\n${threadText}\n\nUSER MESSAGE (they tagged @kanban):\n${userAsk}`;

  const requestBody: OpenAIRequest = {
    model: KANBAN_COMMENT_AI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    temperature: 0.35,
    max_tokens: 900,
  };

  const response = await postViaOpenAiProxy(requestBody);

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenAI API error: ${response.status}${errText ? ` — ${errText.slice(0, 200)}` : ''}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Empty reply from model');
  }
  return text;
}

export async function autocompletion(prompt: string): Promise<OpenAIResponse> {
  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  };

  const response = await postViaOpenAiProxy(requestBody);

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  return data;
}

export type ProjectTaskChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  /** Tasks the user dragged into the composer for this message (UI + API formatting). */
  attachedTasks?: Task[];
};

function sliceForApi(s: string | undefined, max: number): string {
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max)}…[truncated]`;
}

/** Embeds attached task summaries for the model; UI shows only `content` + chips. */
export function formatProjectTaskUserMessageForApi(content: string, attached?: Task[]): string {
  const trimmed = content.trim();
  const body = trimmed || '(No message text — refer to the attached tasks.)';
  if (!attached?.length) return body;
  const lines = attached.map(
    (t) =>
      `• [${t.id}] ${t.title} — status: ${t.status}, type: ${t.type}, priority: ${t.priority}, sprint: ${t.sprint}, due: ${t.due_date}, created: ${t.created_at}, updated: ${t.updated_at}${
        t.description ? `; description: ${sliceForApi(t.description, 500)}` : ''
      }`
  );
  return `The user attached ${attached.length} task(s) for focused context:\n${lines.join('\n')}\n\n---\n\n${body}`;
}

const projectTaskAssistantTools = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description:
        'Create a new task on the current project board. Use when the user asks to add, create, or track new work.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short task title' },
          description: { type: 'string', description: 'Detailed description (optional)' },
          type: { type: 'string', enum: ['bug', 'feature', 'scope'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: {
            type: 'string',
            enum: ['todo', 'in-progress', 'done'],
            description: 'Defaults to todo if omitted',
          },
          sprint: { type: 'integer', description: 'Sprint number (1-based), must fit project num_sprints' },
          due_date: {
            type: 'string',
            description: 'ISO date YYYY-MM-DD; omit for today',
          },
        },
        required: ['title', 'type', 'priority'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description:
        'Update an existing task. Use the exact "id" field from the tasks list in the project JSON. Only include fields that should change.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'Task id from context JSON' },
          title: { type: 'string' },
          description: { type: 'string' },
          type: { type: 'string', enum: ['bug', 'feature', 'scope'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
          sprint: { type: 'integer' },
          due_date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['task_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description:
        'Permanently remove a task from the board. Use when the user asks to delete, remove, or drop a task. Use the exact "id" from the tasks list in the JSON.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'Task id from context JSON' },
        },
        required: ['task_id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_task_comment',
      description:
        'Add a comment to an existing task card (appears in the task modal thread). Use when the user asks to note, comment, log, or record something on a specific task. The comment is saved as the signed-in user. Use the exact task "id" from the tasks array in the JSON.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'Task id from context JSON' },
          body: { type: 'string', description: 'Comment text (plain; be concise unless the user wants detail)' },
        },
        required: ['task_id', 'body'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'undo_last_action',
      description:
        'Revert the most recent successful board change made by you in this chat session (create task, update task, delete task, or add comment). Use when the user asks to undo, revert, or take back the last thing you did. Each call undoes one step, most recent first. If nothing is queued to undo, the tool returns an error.',
      parameters: {
        type: 'object',
        properties: {},
        required: [] as const,
        additionalProperties: false,
      },
    },
  },
] as const;

function buildProjectTaskAssistantSystem(contextJson: string): string {
  return `You are a helpful assistant for a kanban board. You have access to project and task data in the JSON below.

Answer questions using that data. If something is not in the data, say you do not have that information.

Each task includes "created_at" and "updated_at" (ISO timestamps from the database). Each task may include a "comments" array: discussion thread on that card (author, body, created_at). Use it when the user asks about feedback, decisions, or conversation on a task.

If the JSON includes "user_attached_tasks", the user dragged those tasks into the chat for their latest message—treat them as the primary focus when interpreting the question, unless they ask about the whole board.

When the user wants to add, edit, move, rename, or remove tasks, use the create_task, update_task, and delete_task tools. When they want to leave a note or comment on a task (without changing the task fields), use add_task_comment. When they want to reverse your last board change (including a deletion), use undo_last_action. Prefer tools over only describing changes. After tools succeed, briefly confirm what you did in plain language.

For update_task, delete_task, and add_task_comment you MUST use the exact task "id" from the tasks array in the JSON. Do not send created_at or updated_at in update_task; the database maintains those. If multiple tasks match by title, disambiguate or ask the user. Only delete when the user clearly wants a task removed; undo_last_action can restore the last deleted task (task card data) for this session, but not older history.

Be concise. Use short bullet lists when listing multiple tasks.

PROJECT_AND_TASKS_DATA (JSON):
${contextJson}`;
}

/** Fired while the assistant runs: waiting on the API vs executing a board action locally. */
export type ProjectTaskAssistantProgress =
  | { phase: 'awaiting_model' }
  | { phase: 'running_tool'; toolName: string };

/** Chat model used by the project board assistant (single option in UI until more are supported). */
export const PROJECT_TASK_ASSISTANT_MODEL = 'gpt-4o-mini' as const;

export const PROJECT_TASK_ASSISTANT_MODEL_OPTIONS: ReadonlyArray<{ id: string; label: string }> = [
  { id: PROJECT_TASK_ASSISTANT_MODEL, label: 'GPT-4o mini' },
];

export async function runProjectTaskAssistant(
  getContextJson: () => string,
  priorMessages: ProjectTaskChatMessage[],
  userMessage: string,
  executeTool: (name: string, args: Record<string, unknown>) => Promise<string>,
  onProgress?: (event: ProjectTaskAssistantProgress) => void,
  currentMessageAttachments?: Task[]
): Promise<string> {
  const apiMessages: Record<string, unknown>[] = [];

  const pushSystem = () => {
    const ctx = getContextJson();
    const system = buildProjectTaskAssistantSystem(ctx);
    if (apiMessages.length === 0) {
      apiMessages.push({ role: 'system', content: system });
    } else {
      apiMessages[0] = { role: 'system', content: system };
    }
  };

  pushSystem();
  for (const m of priorMessages) {
    apiMessages.push({
      role: m.role,
      content:
        m.role === 'user'
          ? formatProjectTaskUserMessageForApi(m.content, m.attachedTasks)
          : m.content,
    });
  }
  apiMessages.push({
    role: 'user',
    content: formatProjectTaskUserMessageForApi(userMessage, currentMessageAttachments),
  });

  const MAX_TOOL_ROUNDS = 10;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    pushSystem();

    const requestBody: OpenAIRequest = {
      model: PROJECT_TASK_ASSISTANT_MODEL,
      messages: apiMessages,
      temperature: 0.35,
      max_tokens: 1600,
      tools: [...projectTaskAssistantTools],
      tool_choice: 'auto',
    };

    onProgress?.({ phase: 'awaiting_model' });

    const response = await postViaOpenAiProxy(requestBody);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`OpenAI API error: ${response.status}${errText ? ` — ${errText.slice(0, 200)}` : ''}`);
    }

    const data: OpenAIResponse = await response.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;
    if (!msg) {
      throw new Error('Empty response from model');
    }

    const toolCalls = msg.tool_calls;
    const finish = choice.finish_reason;

    if (toolCalls && toolCalls.length > 0) {
      apiMessages.push({
        role: 'assistant',
        content: msg.content ?? null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments || '{}',
          },
        })),
      });

      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
        } catch {
          args = {};
        }
        onProgress?.({ phase: 'running_tool', toolName: tc.function.name });
        const toolContent = await executeTool(tc.function.name, args);
        apiMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: toolContent,
        });
      }
      continue;
    }

    if (msg.content && msg.content.trim()) {
      return msg.content;
    }

    if (finish === 'length') {
      throw new Error('Model response was truncated; try a shorter request.');
    }

    throw new Error('Model returned no text and no tool calls.');
  }

  throw new Error('Too many tool rounds; try breaking the request into smaller steps.');
}
