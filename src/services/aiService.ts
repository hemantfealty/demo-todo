import type { TodoCategory, TodoPriority } from "@/types";

export const aiService = {
  async generateDescription(title: string): Promise<string> {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "AI unavailable");
    return json.data.description;
  },

  async categorize(title: string): Promise<TodoCategory> {
    const res = await fetch("/api/ai/categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "AI unavailable");
    return json.data.category;
  },

  async prioritize(title: string): Promise<TodoPriority> {
    const res = await fetch("/api/ai/prioritize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "AI unavailable");
    return json.data.priority;
  },

  async suggest(title: string): Promise<string[]> {
    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "AI unavailable");
    return json.data.suggestions;
  },
};
