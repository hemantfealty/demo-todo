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
    const description = await ollamaChat([
      {
        role: "system",
        content:
          "You are a helpful task management assistant. Generate a concise, clear task description in 1-2 sentences. No bullet points, no markdown, just plain text.",
      },
      {
        role: "user",
        content: `Generate a description for this task: "${parsed.data.title}"`,
      },
    ]);

    return NextResponse.json({ data: { description } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI service unavailable";
    console.error("[AI/generate]", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }
});
