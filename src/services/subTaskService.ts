import type { SubTask } from "@/types";

export const subTaskService = {
  async create(todoId: string, title: string): Promise<SubTask> {
    const res = await fetch(`/api/todos/${todoId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create subtask");
    return json.data;
  },

  async update(id: string, data: { title?: string; completed?: boolean }): Promise<SubTask> {
    const res = await fetch(`/api/subtasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update subtask");
    return json.data;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/subtasks/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to delete subtask");
  },
};
