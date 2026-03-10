import type { Todo, TodoFilters, CreateTodoInput, UpdateTodoInput } from "@/types";

function buildQuery(filters: TodoFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category && filters.category !== "ALL") params.set("category", filters.category);
  if (filters.priority && filters.priority !== "ALL") params.set("priority", filters.priority);
  if (filters.status && filters.status !== "ALL") params.set("status", filters.status);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const todoService = {
  async getAll(filters: TodoFilters = {}): Promise<Todo[]> {
    const res = await fetch(`/api/todos${buildQuery(filters)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to fetch todos");
    return json.data;
  },

  async create(input: CreateTodoInput): Promise<Todo> {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create todo");
    return json.data;
  },

  async update(id: string, input: UpdateTodoInput): Promise<Todo> {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update todo");
    return json.data;
  },

  async patch(id: string, input: UpdateTodoInput): Promise<Todo> {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update todo");
    return json.data;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to delete todo");
  },
};
