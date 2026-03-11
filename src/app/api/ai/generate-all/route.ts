import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { ollamaChat } from "@/lib/ollama";
import { AppError } from "@/errors";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1) });

const VALID_CATEGORIES = ["WORK", "PERSONAL", "HEALTH", "SHOPPING", "EDUCATION", "FINANCE", "TRAVEL", "OTHER"];
const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("Title is required", 400);

  const title = parsed.data.title;

  // Run all AI calls in parallel for speed
  const [descResult, catResult, priResult, sugResult] = await Promise.allSettled([
    ollamaChat([
      {
        role: "system",
        content:
          "You are a helpful task management assistant. Generate a concise, clear task description in 1-2 sentences. No bullet points, no markdown, just plain text.",
      },
      { role: "user", content: `Generate a description for this task: "${title}"` },
    ]),
    ollamaChat([
      {
        role: "system",
        content: `You are a task categorizer. Reply with ONLY one word from this list: ${VALID_CATEGORIES.join(", ")}. No explanation, no punctuation.`,
      },
      { role: "user", content: `Categorize this task: "${title}"` },
    ]),
    ollamaChat([
      {
        role: "system",
        content:
          "You are a task prioritizer. Reply with ONLY one word: HIGH, MEDIUM, or LOW. No explanation, no punctuation. HIGH = urgent/critical, MEDIUM = normal, LOW = nice to have.",
      },
      { role: "user", content: `What priority should this task have: "${title}"` },
    ]),
    ollamaChat([
      {
        role: "system",
        content:
          'You are a task planner. Given a task title, suggest 3-5 actionable sub-tasks. Reply with ONLY a JSON array of strings. Example: ["Step 1", "Step 2", "Step 3"]. No explanation, no markdown.',
      },
      { role: "user", content: `Suggest sub-tasks for: "${title}"` },
    ]),
  ]);

  // Extract results with fallbacks
  const description = descResult.status === "fulfilled" ? descResult.value : "";

  let category = "OTHER";
  if (catResult.status === "fulfilled") {
    const raw = catResult.value.trim().toUpperCase().replace(/[^A-Z_]/g, "");
    if (VALID_CATEGORIES.includes(raw)) category = raw;
  }

  let priority = "MEDIUM";
  if (priResult.status === "fulfilled") {
    const raw = priResult.value.trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (VALID_PRIORITIES.includes(raw)) priority = raw;
  }

  let suggestions: string[] = [];
  if (sugResult.status === "fulfilled") {
    try {
      const match = sugResult.value.match(/\[[\s\S]*\]/);
      if (match) suggestions = JSON.parse(match[0]);
    } catch {
      // ignore parse errors
    }
  }

  return NextResponse.json({
    data: { description, category, priority, suggestions },
  });
});
