import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { ollamaChat } from "@/lib/ollama";
import { AppError } from "@/errors";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1) });

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("Title is required", 400);

  try {
    const raw = await ollamaChat([
      {
        role: "system",
        content:
          "You are a task planner. Given a task title, suggest 3-5 actionable sub-tasks. Reply with ONLY a JSON array of strings. Example: [\"Step 1\", \"Step 2\", \"Step 3\"]. No explanation, no markdown.",
      },
      {
        role: "user",
        content: `Suggest sub-tasks for: "${parsed.data.title}"`,
      },
    ]);

    let suggestions: string[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) suggestions = JSON.parse(match[0]);
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ data: { suggestions } });
  } catch {
    return NextResponse.json({ data: { suggestions: [] } });
  }
});
