-- Local SQLite schema for `npm run dev:local` (VITE_LOCAL_MODE).
-- Derived from Supabase MCP introspection of public.projects, public.tasks,
-- public.project_collaborators, public.task_comments (Kanban_AI project).
-- No FK to auth.users — local dev uses a fixed synthetic user id.

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  master_plan TEXT,
  initial_prompt TEXT,
  keywords TEXT,
  num_sprints INTEGER,
  current_sprint INTEGER,
  complete INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  due_date TEXT,
  achievements TEXT,
  user_id TEXT,
  projectType TEXT,
  private INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS project_collaborators (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id TEXT,
  role TEXT NOT NULL,
  invited_at TEXT,
  accepted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT,
  status TEXT,
  sprint INTEGER,
  due_date TEXT,
  assignee_id TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  author_display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime ('now'))
);

CREATE INDEX IF NOT EXISTS idx_pc_user ON project_collaborators (user_id, accepted);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments (task_id, created_at);
