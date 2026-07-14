import type { Task } from '../types';
import { PROJECT_SETUP_SYSTEM_PROMPT } from './prompts';
import type { ProjectSetupResult } from './projectSetup';
import { titleFromBrief } from './projectSetup';

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

async function postViaOpenAiProxy(body: object, signal?: AbortSignal): Promise<Response> {
  return fetch(OPENAI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
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

const PROJECT_SETUP_MODEL = 'gpt-4o-mini' as const;

const projectSetupTool = {
  type: 'function',
  function: {
    name: 'create_project_setup',
    description:
      'Create a project title, short description, phased roadmap, and starter kanban tasks from a brief.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short project name (max ~60 chars).',
        },
        description: {
          type: 'string',
          description: '1–2 sentence project description.',
        },
        phases: {
          type: 'array',
          description: 'Roadmap phases sized to the brief (typically 4–8, not a fixed 10).',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['title', 'description'],
          },
          minItems: 3,
          maxItems: 10,
        },
        tasks: {
          type: 'array',
          description: '4–8 concrete starter tasks for the first phase/sprint.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              type: { type: 'string', enum: ['feature', 'scope', 'bug'] },
              sprint: {
                type: 'integer',
                description: '1-based sprint matching a phase index; usually 1 for starters.',
              },
            },
            required: ['title', 'description', 'priority', 'type'],
          },
          minItems: 3,
          maxItems: 10,
        },
      },
      required: ['title', 'description', 'phases', 'tasks'],
      additionalProperties: false,
    },
  },
} as const;

function normalizeSetupResult(raw: unknown, brief: string, explicitTitle?: string): ProjectSetupResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const phasesRaw = Array.isArray(obj.phases) ? obj.phases : [];
  const tasksRaw = Array.isArray(obj.tasks) ? obj.tasks : [];

  const phases = phasesRaw
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
    .map((p) => ({
      title: String(p.title ?? '').trim() || 'Phase',
      description: String(p.description ?? '').trim(),
    }))
    .filter((p) => p.title.length > 0)
    .slice(0, 10);

  const tasks = tasksRaw
    .filter((t): t is Record<string, unknown> => t != null && typeof t === 'object')
    .map((t) => {
      const priority = String(t.priority ?? 'medium');
      const type = String(t.type ?? 'feature');
      const sprintNum = Number(t.sprint);
      return {
        title: String(t.title ?? '').trim(),
        description: String(t.description ?? '').trim(),
        priority: (['low', 'medium', 'high'].includes(priority) ? priority : 'medium') as
          | 'low'
          | 'medium'
          | 'high',
        type: (['feature', 'scope', 'bug'].includes(type) ? type : 'feature') as
          | 'feature'
          | 'scope'
          | 'bug',
        sprint: Number.isFinite(sprintNum) && sprintNum >= 1 ? Math.floor(sprintNum) : 1,
      };
    })
    .filter((t) => t.title.length > 0)
    .slice(0, 10);

  if (phases.length === 0) {
    phases.push({
      title: 'Get started',
      description: 'Clarify scope, set up the workspace, and ship a thin vertical slice.',
    });
  }
  if (tasks.length === 0) {
    tasks.push({
      title: 'Write a one-page brief',
      description: 'Capture goals, users, and non-goals for the first milestone.',
      priority: 'high',
      type: 'scope',
      sprint: 1,
    });
  }

  const aiTitle = String(obj.title ?? '').trim();
  const aiDescription = String(obj.description ?? '').trim();

  return {
    title: titleFromBrief(brief, explicitTitle || aiTitle || undefined),
    description: aiDescription || brief.trim().slice(0, 400) || 'No description added.',
    phases,
    tasks,
  };
}

/** Single-shot project setup: roadmap phases + starter tasks from a freeform brief. */
export async function generateProjectSetup(input: {
  brief: string;
  title?: string;
  signal?: AbortSignal;
}): Promise<ProjectSetupResult> {
  const brief = input.brief.trim();
  if (!brief) {
    throw new Error('Project brief is required');
  }

  const titleHint = input.title?.trim();
  const userContent = titleHint
    ? `Suggested title (use or improve): "${titleHint}"\n\nProject brief:\n${brief}`
    : `Project brief:\n${brief}`;

  const requestBody: OpenAIRequest = {
    model: PROJECT_SETUP_MODEL,
    messages: [
      { role: 'system', content: PROJECT_SETUP_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
    temperature: 0.6,
    max_tokens: 1800,
    tools: [projectSetupTool],
    tool_choice: { type: 'function', function: { name: 'create_project_setup' } },
  };

  const response = await postViaOpenAiProxy(requestBody, input.signal);
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = (await response.json()) as OpenAIResponse;
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error('AI did not return a project setup');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch {
    throw new Error('AI returned invalid project setup JSON');
  }

  return normalizeSetupResult(parsed, brief, titleHint);
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
Reply in GitHub-flavored markdown when helpful (bullet lists, **bold**, short ## headings).
Keep answers focused and actionable unless the user asks for depth.`;

  const userContent = `TASK:\n${taskBlock}\n\nCOMMENT THREAD (oldest to newest):\n${threadText}\n\nUSER MESSAGE (they tagged @kanban):\n${userAsk}`;

  const requestBody: OpenAIRequest = {
    model: KANBAN_COMMENT_AI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    temperature: 0.35,
    max_tokens: 2500,
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
