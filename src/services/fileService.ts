import type { TodoFile } from "@/types";

export const fileService = {
  async upload(todoId: string, file: File): Promise<TodoFile> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("todoId", todoId);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Upload failed");
    return json.data;
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? "Delete failed");
    }
  },
};
