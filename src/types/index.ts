// ─── Enums ────────────────────────────────────────────────────────────────────

export type TodoStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type TodoPriority = "HIGH" | "MEDIUM" | "LOW";
export type TodoCategory =
  | "WORK"
  | "PERSONAL"
  | "HEALTH"
  | "SHOPPING"
  | "EDUCATION"
  | "FINANCE"
  | "TRAVEL"
  | "OTHER";

// ─── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  todoId: string;
}

export interface TodoFile {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  todoId: string;
}

export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  category: TodoCategory;
  priority: TodoPriority;
  status: TodoStatus;
  dueDate?: string | null;
  order: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  subTasks: SubTask[];
  files: TodoFile[];
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Filter / Search ──────────────────────────────────────────────────────────

export interface TodoFilters {
  search?: string;
  category?: TodoCategory | "ALL";
  priority?: TodoPriority | "ALL";
  status?: TodoStatus | "ALL";
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface CreateTodoInput {
  title: string;
  description?: string;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate?: string;
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  status?: TodoStatus;
  order?: number;
}
