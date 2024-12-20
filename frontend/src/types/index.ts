export type Priority = 'low' | 'medium' | 'high';
export type TaskType = 'bug' | 'feature' | 'scope';
export type Status = 'todo' | 'in-progress' | 'in-review';

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
  assignee_id: {
    id: string;
    name: string;
    avatar: string;
  };
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
  tasks: Task[];
  num_sprints: number;
  due_date: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  // Add any other properties that are part of the User object
}
