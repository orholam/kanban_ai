export type Priority = 'low' | 'medium' | 'high';
export type TaskType = 'bug' | 'feature' | 'scope';
export type Status = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
  status: Status;
  sprint: number;
  due_date: string;
  assignee_id: string; // Changed from object to string to match database schema
  created_at: string;
  /** Set by Postgres (default/trigger). Guest boards set this client-side. */
  updated_at: string;
  isAnimated?: boolean;
  /** Client-only: brief highlight when the AI sidebar creates or updates this task. */
  aiBrandish?: boolean;
}

/** Row in `task_comments` (loaded in the task modal / public project view). */
export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  author_display_name: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  projects: Project[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  master_plan: string;
  initial_prompt: string;
  keywords: string;
  projectType: string; // Add this field for project type
  num_sprints: number;
  current_sprint: number;
  due_date: string;
  achievements: string;
  complete: boolean;
  created_at: string;
  user_id: string;
  private?: boolean; // Add private field, optional since existing projects might not have it
  notes?: string; // Add notes field for project notes
  tasks: Task[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  // Add any other properties that are part of the User object
}

/** Account-level access (not the same as `project_collaborators.role`). */
export type AccountRole = 'owner' | 'editor' | 'admin';

export type SubscriptionPlan = 'free' | 'pro';

/** Row in `analytics_events` (first-party usage telemetry). */
export type AnalyticsEventType =
  | 'sign_up'
  | 'sign_in'
  | 'ai_interaction'
  | 'task_write'
  | 'lp_view'
  | 'lp_cta_click';

export interface AnalyticsEventRow {
  id: string;
  created_at: string;
  user_id: string | null;
  guest_session_id?: string | null;
  event_type: AnalyticsEventType;
  metadata: Record<string, unknown>;
}

/** Row in `profiles` (synced on signup; display names also updated from Account). */
export interface AccountProfileRow {
  id: string;
  full_name: string | null;
  display_name: string | null;
  name: string | null;
  username: string | null;
  account_role: AccountRole;
  subscription_plan: SubscriptionPlan;
  created_at?: string;
  updated_at?: string;
}
