import type { TodoCategory, TodoPriority } from "@/types";

interface GenerateAllResult {
  description: string;
  category: TodoCategory;
  priority: TodoPriority;
  suggestions: string[];
}

export const aiService = {
  async generateAll(title: string): Promise<GenerateAllResult> {
    const res = await fetch("/api/ai/generate-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "AI unavailable");
    return json.data;
  },
};
