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
  comments?: Comment[];
  isAnimated?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    avatar: string;
  };
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
  num_sprints: number;
  current_sprint: number;
  due_date: string;
  achievements: string;
  complete: boolean;
  created_at: string;
  user_id: string;
  tasks: Task[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  // Add any other properties that are part of the User object
}
