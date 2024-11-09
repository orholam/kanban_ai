export type Priority = 'low' | 'medium' | 'high';
export type TaskType = 'bug' | 'feature' | 'scope';
export type Status = 'todo' | 'in-progress' | 'in-review';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: Priority;
  status: Status;
  sprint: number;
  dueDate: string;
  assignee: {
    id: string;
    name: string;
    avatar: string;
  };
  comments: Comment[];
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
  name: string;
  tasks: Task[];
}