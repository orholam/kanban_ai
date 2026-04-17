/**
 * Local dev API for VITE_LOCAL_MODE: SQLite persistence + OpenAI proxy.
 * Run via `npm run dev:local` (with Vite). Listens on port 3000 — Vite proxies `/api` here.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(FRONTEND_ROOT, '..');
const DATA_DIR = path.join(REPO_ROOT, '.local');
const DB_PATH = path.join(DATA_DIR, 'kanban.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'local-schema.sql');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const PORT = Number(process.env.LOCAL_API_PORT || 3000);

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnvFile(path.join(FRONTEND_ROOT, '.env'));
loadDotEnvFile(path.join(FRONTEND_ROOT, '.env.local'));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));

function boolFromSql(v) {
  return v === 1 || v === true;
}

function intFromBool(v) {
  return v ? 1 : 0;
}

function mapProjectRow(r) {
  if (!r) return null;
  return {
    ...r,
    complete: boolFromSql(r.complete),
    private: r.private == null ? true : boolFromSql(r.private),
  };
}

function mapTaskRow(r) {
  if (!r) return null;
  const updated =
    r.updated_at && String(r.updated_at).trim()
      ? r.updated_at
      : r.created_at && String(r.created_at).trim()
        ? r.created_at
        : new Date().toISOString();
  return {
    ...r,
    updated_at: updated,
  };
}

async function readBodyJson(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readBodyBuffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendText(res, status, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType });
  res.end(text);
}

/** GET /api/local/workspace?user_id=… */
function handleWorkspace(res, userId) {
  const rows = db
    .prepare(
      `SELECT p.* FROM projects p
       INNER JOIN project_collaborators pc ON pc.project_id = p.id
       WHERE pc.user_id = ? AND pc.accepted = 1
       ORDER BY datetime(COALESCE(p.created_at, '1970-01-01')) ASC`
    )
    .all(userId);
  const projects = rows.map((r) => ({
    ...mapProjectRow(r),
    master_plan: '',
    initial_prompt: '',
    achievements: '',
    notes: r.notes ?? '',
    projectType: r.projectType || 'Manual',
    tasks: [],
  }));
  sendJson(res, 200, { projects });
}

/** POST /api/local/projects  body: { project, collaborator } */
function handleCreateProject(res, body) {
  const project = body.project;
  const collab = body.collaborator;
  if (!project?.id || !project?.title) {
    sendJson(res, 400, { error: 'Invalid project payload' });
    return;
  }
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO projects (
        id, title, description, master_plan, initial_prompt, keywords,
        num_sprints, current_sprint, complete, created_at, due_date, achievements,
        user_id, projectType, private, notes
      ) VALUES (
        @id, @title, @description, @master_plan, @initial_prompt, @keywords,
        @num_sprints, @current_sprint, @complete, @created_at, @due_date, @achievements,
        @user_id, @projectType, @private, @notes
      )`
    ).run({
      id: project.id,
      title: project.title,
      description: project.description ?? null,
      master_plan: project.master_plan ?? '',
      initial_prompt: project.initial_prompt ?? '',
      keywords: project.keywords ?? '',
      num_sprints: project.num_sprints ?? 10,
      current_sprint: project.current_sprint ?? 1,
      complete: intFromBool(project.complete),
      created_at: project.created_at ?? new Date().toISOString(),
      due_date: project.due_date ?? null,
      achievements: project.achievements ?? '',
      user_id: project.user_id ?? null,
      projectType: project.projectType ?? 'Manual',
      private: intFromBool(project.private !== false),
      notes: project.notes ?? null,
    });
    db.prepare(
      `INSERT INTO project_collaborators (id, project_id, user_id, role, invited_at, accepted)
       VALUES (@id, @project_id, @user_id, @role, @invited_at, @accepted)`
    ).run({
      id: collab?.id || crypto.randomUUID(),
      project_id: project.id,
      user_id: collab?.user_id ?? project.user_id,
      role: collab?.role || 'owner',
      invited_at: collab?.invited_at ?? new Date().toISOString(),
      accepted: intFromBool(collab?.accepted !== false),
    });
  });
  tx();
  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(project.id);
  sendJson(res, 201, { project: mapProjectRow(created), ok: true });
}

function handleGetProject(res, projectId) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!row) {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }
  sendJson(res, 200, { project: mapProjectRow(row) });
}

function handleDeleteProject(res, projectId) {
  db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  sendJson(res, 200, { ok: true });
}

function handleListTasks(res, projectId) {
  const rows = db
    .prepare(`SELECT * FROM tasks WHERE project_id = ? ORDER BY datetime(COALESCE(created_at, '1970-01-01')) ASC`)
    .all(projectId);
  sendJson(res, 200, { tasks: rows.map(mapTaskRow) });
}

function handleInsertTask(res, body) {
  const t = body.task ?? body;
  const now = new Date().toISOString();
  const id = t.id;
  if (!id || !t.project_id || !t.title) {
    sendJson(res, 400, { error: 'Invalid task' });
    return;
  }
  const created = t.created_at || now.split('T')[0];
  const updated = t.updated_at || now;
  db.prepare(
    `INSERT INTO tasks (id, project_id, title, description, type, priority, status, sprint, due_date, assignee_id, created_at, updated_at)
     VALUES (@id, @project_id, @title, @description, @type, @priority, @status, @sprint, @due_date, @assignee_id, @created_at, @updated_at)`
  ).run({
    id,
    project_id: t.project_id,
    title: t.title,
    description: t.description ?? '',
    type: t.type ?? 'feature',
    priority: t.priority ?? 'medium',
    status: t.status ?? 'todo',
    sprint: t.sprint ?? 1,
    due_date: t.due_date ?? null,
    assignee_id: t.assignee_id && String(t.assignee_id).trim() ? t.assignee_id : null,
    created_at: created,
    updated_at: updated,
  });
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  sendJson(res, 201, { task: mapTaskRow(row) });
}

function handlePatchTask(res, taskId, body) {
  const allowed = ['title', 'description', 'type', 'priority', 'status', 'sprint', 'due_date', 'assignee_id'];
  const sets = [];
  const params = {};
  for (const k of allowed) {
    if (k in body) {
      sets.push(`${k} = @${k}`);
      params[k] = body[k];
    }
  }
  sets.push(`updated_at = @updated_at`);
  params.updated_at = new Date().toISOString();
  params._id = taskId;
  if (sets.length === 1) {
    sendJson(res, 400, { error: 'No fields to update' });
    return;
  }
  db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = @_id`).run(params);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!row) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }
  sendJson(res, 200, { task: mapTaskRow(row) });
}

function handleDeleteTask(res, taskId) {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  sendJson(res, 200, { ok: true });
}

function handlePatchProject(res, projectId, body) {
  const allowed = ['title', 'description', 'notes', 'private', 'master_plan', 'initial_prompt', 'keywords', 'num_sprints', 'current_sprint', 'complete', 'due_date', 'achievements', 'projectType'];
  const sets = [];
  const params = { _id: projectId };
  for (const k of allowed) {
    if (k in body) {
      if (k === 'private' || k === 'complete') {
        sets.push(`${k} = @${k}`);
        params[k] = intFromBool(body[k]);
      } else {
        sets.push(`${k} = @${k}`);
        params[k] = body[k];
      }
    }
  }
  if (sets.length === 0) {
    sendJson(res, 400, { error: 'No fields' });
    return;
  }
  db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = @_id`).run(params);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  sendJson(res, 200, { project: mapProjectRow(row) });
}

function handlePublicProject(res, projectId) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!row || intFromBool(row.private)) {
    sendJson(res, 404, { error: 'not_found' });
    return;
  }
  sendJson(res, 200, { project: mapProjectRow(row) });
}

function handleListComments(res, taskIds) {
  if (!taskIds.length) {
    sendJson(res, 200, { comments: [] });
    return;
  }
  const placeholders = taskIds.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT * FROM task_comments WHERE task_id IN (${placeholders}) ORDER BY datetime(created_at) ASC`)
    .all(...taskIds);
  sendJson(res, 200, { comments: rows });
}

function handleInsertComment(res, body) {
  const id = body.id || crypto.randomUUID();
  const { task_id, user_id, body: textBody, author_display_name } = body;
  if (!task_id || !user_id || !textBody?.trim()) {
    sendJson(res, 400, { error: 'Invalid comment' });
    return;
  }
  db.prepare(
    `INSERT INTO task_comments (id, task_id, user_id, body, author_display_name)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, task_id, user_id, String(textBody).trim(), author_display_name ?? null);
  const row = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id);
  sendJson(res, 201, { comment: row });
}

function handleDeleteComment(res, commentId) {
  db.prepare('DELETE FROM task_comments WHERE id = ?').run(commentId);
  sendJson(res, 200, { ok: true });
}

async function handleOpenAi(req, res) {
  if (req.method === 'GET') {
    sendJson(res, 200, { configured: Boolean(process.env.OPENAI_API_KEY) });
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(res, 503, { error: 'OpenAI is not configured on the server' });
    return;
  }
  let body;
  try {
    body = JSON.parse((await readBodyBuffer(req)).toString('utf8') || '{}');
  } catch {
    body = {};
  }
  const stream = Boolean(body.stream);
  let upstream;
  try {
    upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error(e);
    sendJson(res, 502, { error: 'Failed to reach OpenAI' });
    return;
  }
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    sendText(res, upstream.status, errText || upstream.statusText);
    return;
  }
  if (stream && upstream.body) {
    const ct = upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8';
    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': 'no-cache',
    });
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    const reader = upstream.body.getReader();
    try {
      let chunk = await reader.read();
      while (!chunk.done) {
        res.write(Buffer.from(chunk.value));
        chunk = await reader.read();
      }
    } finally {
      res.end();
    }
    return;
  }
  const json = await upstream.json().catch(() => null);
  if (json == null) {
    sendJson(res, 502, { error: 'Invalid JSON from OpenAI' });
    return;
  }
  sendJson(res, 200, json);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const method = req.method || 'GET';

    if (pathname === '/api/openai') {
      await handleOpenAi(req, res);
      return;
    }

    if (pathname === '/api/local/workspace' && method === 'GET') {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        sendJson(res, 400, { error: 'user_id required' });
        return;
      }
      handleWorkspace(res, userId);
      return;
    }

    if (pathname === '/api/local/projects' && method === 'POST') {
      handleCreateProject(res, await readBodyJson(req));
      return;
    }

    const listTasks = pathname.match(/^\/api\/local\/projects\/([^/]+)\/tasks$/);
    if (listTasks && method === 'GET') {
      handleListTasks(res, listTasks[1]);
      return;
    }

    const oneProj = pathname.match(/^\/api\/local\/projects\/([^/]+)$/);
    if (oneProj && method === 'GET') {
      handleGetProject(res, oneProj[1]);
      return;
    }

    const delProj = pathname.match(/^\/api\/local\/projects\/([^/]+)$/);
    if (delProj && method === 'DELETE') {
      handleDeleteProject(res, delProj[1]);
      return;
    }

    const patchProj = pathname.match(/^\/api\/local\/projects\/([^/]+)$/);
    if (patchProj && method === 'PATCH') {
      handlePatchProject(res, patchProj[1], await readBodyJson(req));
      return;
    }

    const pub = pathname.match(/^\/api\/local\/public\/projects\/([^/]+)$/);
    if (pub && method === 'GET') {
      handlePublicProject(res, pub[1]);
      return;
    }

    if (pathname === '/api/local/tasks' && method === 'POST') {
      handleInsertTask(res, await readBodyJson(req));
      return;
    }

    const patchTask = pathname.match(/^\/api\/local\/tasks\/([^/]+)$/);
    if (patchTask && method === 'PATCH') {
      handlePatchTask(res, patchTask[1], await readBodyJson(req));
      return;
    }

    const delTask = pathname.match(/^\/api\/local\/tasks\/([^/]+)$/);
    if (delTask && method === 'DELETE') {
      handleDeleteTask(res, delTask[1]);
      return;
    }

    if (pathname === '/api/local/task-comments' && method === 'GET') {
      const raw = url.searchParams.get('task_ids') || '';
      const taskIds = raw.split(',').map((s) => s.trim()).filter(Boolean);
      handleListComments(res, taskIds);
      return;
    }

    if (pathname === '/api/local/task-comments' && method === 'POST') {
      handleInsertComment(res, await readBodyJson(req));
      return;
    }

    const delCom = pathname.match(/^\/api\/local\/task-comments\/([^/]+)$/);
    if (delCom && method === 'DELETE') {
      handleDeleteComment(res, delCom[1]);
      return;
    }

    sendJson(res, 404, { error: 'Not found', path: pathname });
  } catch (e) {
    console.error(e);
    sendJson(res, 500, { error: String(e?.message || e) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[local-dev-server] http://127.0.0.1:${PORT}  SQLite → ${DB_PATH}`);
});
