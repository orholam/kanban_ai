import type { Task } from '../types';
import { PROJECT_BUILDER_CHAT_SYSTEM_PROMPT, PROJECT_BUILDER_REPLY_HINT, PROJECT_BUILDER_TOOLS_HINT, PROJECT_SETUP_SYSTEM_PROMPT } from './prompts';
import type { ProjectBuilderDraft, ProjectSetupResult, GeneratedSetupTask, RoadmapPhase } from './projectSetup';
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
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
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

const PROJECT_BUILDER_MODEL = 'gpt-4o-mini' as const;

const projectBuilderTools = [
  {
    type: 'function',
    function: {
      name: 'update_project_identity',
      description:
        'Set title and description ONLY if they differ from the current workspace. Skip if unchanged.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short project name (max ~60 chars).' },
          description: { type: 'string', description: '1–2 sentence description.' },
        },
        required: ['title', 'description'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_roadmap',
      description:
        'Replace roadmap phases ONLY if the plan should change. Skip if phases would be the same.',
      parameters: {
        type: 'object',
        properties: {
          phases: {
            type: 'array',
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
        },
        required: ['phases'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_starter_tasks',
      description:
        'Replace starter tasks ONLY if the backlog should change. Skip if tasks would be the same.',
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
                sprint: { type: 'integer' },
              },
              required: ['title', 'description', 'priority', 'type'],
            },
            minItems: 3,
            maxItems: 10,
          },
        },
        required: ['tasks'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_focus_phase',
      description: 'Highlight which roadmap phase (0-based index) you are currently shaping.',
      parameters: {
        type: 'object',
        properties: {
          index: { type: 'integer', minimum: 0 },
        },
        required: ['index'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_create_board',
      description:
        'Create the board now when the user is ready (e.g. "let\'s go", "create it", "ship it", "looks good"). Do not call this while still rewriting the plan. Does not replace set_roadmap/set_starter_tasks.',
      parameters: {
        type: 'object',
        properties: {
          reason: {
            type: 'string',
            description: 'Short reason, e.g. "user said ready".',
          },
        },
        additionalProperties: false,
      },
    },
  },
] as const;

export type ProjectBuilderChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ProjectBuilderProgress =
  | { phase: 'awaiting_model' }
  | { phase: 'streaming_reply' }
  | { phase: 'running_tool'; toolName: string }
  | { phase: 'streaming_after_tools' };

function normalizePhases(raw: unknown): RoadmapPhase[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
    .map((p) => ({
      title: String(p.title ?? '').trim() || 'Phase',
      description: String(p.description ?? '').trim(),
    }))
    .filter((p) => p.title.length > 0)
    .slice(0, 10);
}

function normalizeTasks(raw: unknown): GeneratedSetupTask[] {
  if (!Array.isArray(raw)) return [];
  return raw
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
}

function buildProjectBuilderSystem(draft: ProjectBuilderDraft): string {
  const readyToCreate = draft.title.trim().length > 0 && draft.phases.length > 0;
  const isFirstDraft = !draft.title.trim() || draft.phases.length < 3;

  return `${PROJECT_BUILDER_CHAT_SYSTEM_PROMPT}

Workspace status:
- readyToCreate: ${readyToCreate}
- firstDraftNeeded: ${isFirstDraft}
- title: ${draft.title.trim() ? 'set' : 'empty'}
- phases: ${draft.phases.length}
- tasks: ${draft.tasks.length}

If readyToCreate and the user wants to start/create/go, call request_create_board. Do not rewrite the whole plan.

Current workspace JSON (read-only snapshot — update via tools):
${JSON.stringify(
  {
    title: draft.title,
    description: draft.description,
    phases: draft.phases,
    tasks: draft.tasks,
    focusPhaseIndex: draft.focusPhaseIndex,
  },
  null,
  2
)}`;
}

type StreamedToolCall = {
  id: string;
  name: string;
  arguments: string;
};

type StreamRoundResult = {
  content: string;
  toolCalls: StreamedToolCall[];
  finishReason: string | null;
};

/** Parse one OpenAI chat.completion stream round (text deltas + tool_calls). */
async function consumeOpenAiChatStream(
  response: Response,
  onContentDelta?: (fullText: string) => void
): Promise<StreamRoundResult> {
  if (!response.body) {
    throw new Error('OpenAI stream missing body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  const toolByIndex = new Map<number, StreamedToolCall>();
  let finishReason: string | null = null;

  const applyDelta = (delta: Record<string, unknown>, choiceFinish: string | null | undefined) => {
    if (typeof delta.content === 'string' && delta.content) {
      content += delta.content;
      onContentDelta?.(content);
    }
    const toolCalls = delta.tool_calls;
    if (Array.isArray(toolCalls)) {
      for (const raw of toolCalls) {
        if (!raw || typeof raw !== 'object') continue;
        const tc = raw as {
          index?: number;
          id?: string;
          function?: { name?: string; arguments?: string };
        };
        const index = typeof tc.index === 'number' ? tc.index : 0;
        const existing = toolByIndex.get(index) ?? { id: '', name: '', arguments: '' };
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.name = tc.function.name;
        if (typeof tc.function?.arguments === 'string') {
          existing.arguments += tc.function.arguments;
        }
        toolByIndex.set(index, existing);
      }
    }
    if (choiceFinish) finishReason = choiceFinish;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      if (!parsed || typeof parsed !== 'object') continue;
      const choice = (parsed as { choices?: Array<{ delta?: Record<string, unknown>; finish_reason?: string | null }> })
        .choices?.[0];
      if (!choice) continue;
      applyDelta(choice.delta ?? {}, choice.finish_reason);
    }
  }

  const toolCalls = [...toolByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, tc]) => tc)
    .filter((tc) => tc.name);

  return { content, toolCalls, finishReason };
}

/**
 * Two-step builder turn:
 * 1) Stream a real chat reply (no tools) — intent, follow-up question, or steer.
 * 2) Optional tools round — only if the workspace should change; may call zero tools.
 */
export async function runProjectBuilderChat(input: {
  priorMessages: ProjectBuilderChatMessage[];
  userMessage: string;
  getDraft: () => ProjectBuilderDraft;
  applyTool: (name: string, args: Record<string, unknown>) => string;
  onProgress?: (event: ProjectBuilderProgress) => void;
  /** Streaming text for the primary reply bubble (step 1). */
  onReplyDelta?: (text: string) => void;
  /** Optional text after tools (rare; usually empty). */
  onAfterToolsDelta?: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const apiMessages: Record<string, unknown>[] = [
    { role: 'system', content: buildProjectBuilderSystem(input.getDraft()) },
  ];
  for (const m of input.priorMessages) {
    apiMessages.push({ role: m.role, content: m.content });
  }
  apiMessages.push({ role: 'user', content: input.userMessage });
  apiMessages.push({ role: 'system', content: PROJECT_BUILDER_REPLY_HINT });

  // ── Step 1: real streamed reply, no tools ────────────────────────────────
  input.onProgress?.({ phase: 'awaiting_model' });
  const replyResponse = await postViaOpenAiProxy(
    {
      model: PROJECT_BUILDER_MODEL,
      messages: apiMessages,
      temperature: 0.6,
      max_tokens: 280,
      stream: true,
    } satisfies OpenAIRequest,
    input.signal
  );

  if (!replyResponse.ok) {
    const errText = await replyResponse.text().catch(() => '');
    throw new Error(
      `OpenAI API error: ${replyResponse.status}${errText ? ` — ${errText.slice(0, 200)}` : ''}`
    );
  }

  input.onProgress?.({ phase: 'streaming_reply' });
  const replyRound = await consumeOpenAiChatStream(replyResponse, (text) => {
    input.onReplyDelta?.(text);
  });
  const replyText = replyRound.content.trim();
  if (!replyText) {
    throw new Error('Model returned an empty reply.');
  }

  apiMessages.pop(); // remove reply hint
  apiMessages.push({ role: 'assistant', content: replyText });
  apiMessages[0] = { role: 'system', content: buildProjectBuilderSystem(input.getDraft()) };
  apiMessages.push({ role: 'user', content: PROJECT_BUILDER_TOOLS_HINT });

  // ── Step 2: optional tools ───────────────────────────────────────────────
  input.onProgress?.({ phase: 'awaiting_model' });
  const toolsResponse = await postViaOpenAiProxy(
    {
      model: PROJECT_BUILDER_MODEL,
      messages: apiMessages,
      temperature: 0.4,
      max_tokens: 1100,
      tools: [...projectBuilderTools],
      tool_choice: 'auto',
      stream: true,
    } satisfies OpenAIRequest,
    input.signal
  );

  if (!toolsResponse.ok) {
    const errText = await toolsResponse.text().catch(() => '');
    throw new Error(
      `OpenAI API error: ${toolsResponse.status}${errText ? ` — ${errText.slice(0, 200)}` : ''}`
    );
  }

  const toolsRound = await consumeOpenAiChatStream(toolsResponse);

  if (toolsRound.toolCalls.length > 0) {
    apiMessages.push({
      role: 'assistant',
      content: toolsRound.content || null,
      tool_calls: toolsRound.toolCalls.map((tc) => ({
        id: tc.id || `call_${tc.name}_1`,
        type: 'function',
        function: { name: tc.name, arguments: tc.arguments || '{}' },
      })),
    });

    for (const tc of toolsRound.toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.arguments || '{}') as Record<string, unknown>;
      } catch {
        args = {};
      }
      input.onProgress?.({ phase: 'running_tool', toolName: tc.name });
      const toolContent = input.applyTool(tc.name, args);
      apiMessages.push({
        role: 'tool',
        tool_call_id: tc.id || `call_${tc.name}_1`,
        content: toolContent,
      });
    }

    const after = toolsRound.content.trim();
    if (after) {
      input.onProgress?.({ phase: 'streaming_after_tools' });
      input.onAfterToolsDelta?.(after);
    }
  }

  return replyText;
}

function phasesEqual(a: RoadmapPhase[], b: RoadmapPhase[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (p, i) => p.title === b[i]?.title && p.description === b[i]?.description
  );
}

function tasksEqual(a: GeneratedSetupTask[], b: GeneratedSetupTask[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((t, i) => {
    const o = b[i];
    return (
      !!o &&
      t.title === o.title &&
      t.description === o.description &&
      t.priority === o.priority &&
      t.type === o.type &&
      (t.sprint ?? 1) === (o.sprint ?? 1)
    );
  });
}

/** Apply a builder tool to a draft; returns a short result string for the model. */
export function applyProjectBuilderTool(
  draft: ProjectBuilderDraft,
  name: string,
  args: Record<string, unknown>
): { draft: ProjectBuilderDraft; result: string } {
  switch (name) {
    case 'update_project_identity': {
      const title = String(args.title ?? '').trim().slice(0, 80);
      const description = String(args.description ?? '').trim().slice(0, 600);
      if (!title) return { draft, result: 'Rejected: title required.' };
      const nextDescription = description || draft.description;
      if (title === draft.title.trim() && nextDescription === draft.description.trim()) {
        return { draft, result: JSON.stringify({ ok: true, unchanged: true }) };
      }
      return {
        draft: { ...draft, title, description: nextDescription },
        result: JSON.stringify({ ok: true, title, description: nextDescription }),
      };
    }
    case 'set_roadmap': {
      const phases = normalizePhases(args.phases);
      if (phases.length < 3) {
        return { draft, result: 'Rejected: need at least 3 phases.' };
      }
      if (phasesEqual(phases, draft.phases)) {
        return { draft, result: JSON.stringify({ ok: true, unchanged: true }) };
      }
      const focusPhaseIndex =
        draft.focusPhaseIndex != null && draft.focusPhaseIndex < phases.length
          ? draft.focusPhaseIndex
          : 0;
      return {
        draft: { ...draft, phases, focusPhaseIndex },
        result: JSON.stringify({ ok: true, phaseCount: phases.length }),
      };
    }
    case 'set_starter_tasks': {
      const tasks = normalizeTasks(args.tasks);
      if (tasks.length < 3) {
        return { draft, result: 'Rejected: need at least 3 starter tasks.' };
      }
      if (tasksEqual(tasks, draft.tasks)) {
        return { draft, result: JSON.stringify({ ok: true, unchanged: true }) };
      }
      return {
        draft: { ...draft, tasks },
        result: JSON.stringify({ ok: true, taskCount: tasks.length }),
      };
    }
    case 'set_focus_phase': {
      const index = Number(args.index);
      if (!Number.isFinite(index) || index < 0) {
        return { draft, result: 'Rejected: invalid phase index.' };
      }
      const clamped = Math.min(Math.floor(index), Math.max(0, draft.phases.length - 1));
      const next = draft.phases.length ? clamped : null;
      if (next === draft.focusPhaseIndex) {
        return { draft, result: JSON.stringify({ ok: true, unchanged: true }) };
      }
      return {
        draft: { ...draft, focusPhaseIndex: next },
        result: JSON.stringify({ ok: true, focusPhaseIndex: next }),
      };
    }
    case 'request_create_board': {
      const ready = draft.title.trim().length > 0 && draft.phases.length > 0;
      if (!ready) {
        return {
          draft,
          result: JSON.stringify({
            ok: false,
            reason: 'Workspace not ready — need a title and at least one roadmap phase first.',
          }),
        };
      }
      return {
        draft,
        result: JSON.stringify({
          ok: true,
          createBoard: true,
          reason: String(args.reason ?? '').trim() || 'User requested create',
        }),
      };
    }
    default:
      return { draft, result: `Unknown tool: ${name}` };
  }
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
      name: 'update_project',
      description:
        'Update the current project title, short description, and/or roadmap phases. Use when the user wants to change board metadata or the roadmap — not for editing individual tasks. Only include fields that should change. Providing phases replaces the whole roadmap.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short project name (max ~80 chars)' },
          description: { type: 'string', description: '1–3 sentence project pitch / description' },
          phases: {
            type: 'array',
            description: 'Full replacement roadmap (typically 3–8 phases). Omit to leave the roadmap unchanged.',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['title', 'description'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
    },
  },
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
        'Revert the most recent successful board change made by you in this chat session (update project, create/update/delete task, or add comment). Use when the user asks to undo, revert, or take back the last thing you did. Each call undoes one step, most recent first. If nothing is queued to undo, the tool returns an error.',
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

When the user wants to change the project title, description, or roadmap (master_plan phases), use update_project. Do not invent tasks as a substitute for updating metadata. When they want to add, edit, move, rename, or remove tasks, use the create_task, update_task, and delete_task tools. When they want to leave a note or comment on a task (without changing the task fields), use add_task_comment. When they want to reverse your last board change (including a deletion or project update), use undo_last_action. Prefer tools over only describing changes. After tools succeed, briefly confirm what you did in plain language.

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
