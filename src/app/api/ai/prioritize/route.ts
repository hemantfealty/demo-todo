import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { ollamaChat } from "@/lib/ollama";
import { AppError } from "@/errors";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1) });
const VALID_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("Title is required", 400);

  try {
    const raw = await ollamaChat([
      {
        role: "system",
        content: `You are a task prioritizer. Reply with ONLY one word: HIGH, MEDIUM, or LOW. No explanation, no punctuation. HIGH = urgent/critical, MEDIUM = normal, LOW = nice to have.`,
      },
      {
        role: "user",
        content: `What priority should this task have: "${parsed.data.title}"`,
      },
    ]);

    const priority = raw.trim().toUpperCase().replace(/[^A-Z]/g, "");
    const valid = VALID_PRIORITIES.includes(priority) ? priority : "MEDIUM";

    return NextResponse.json({ data: { priority: valid } });
  } catch {
    return NextResponse.json({ data: { priority: "MEDIUM" } });
  }
});
