import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { ollamaChat } from "@/lib/ollama";
import { AppError } from "@/errors";
import { z } from "zod";

const schema = z.object({ title: z.string().min(1) });
const VALID_CATEGORIES = ["WORK", "PERSONAL", "HEALTH", "SHOPPING", "EDUCATION", "FINANCE", "TRAVEL", "OTHER"];

export const POST = withAuth(async (req) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AppError("Title is required", 400);

  try {
    const raw = await ollamaChat([
      {
        role: "system",
        content: `You are a task categorizer. Reply with ONLY one word from this list: ${VALID_CATEGORIES.join(", ")}. No explanation, no punctuation.`,
      },
      {
        role: "user",
        content: `Categorize this task: "${parsed.data.title}"`,
      },
    ]);

    const category = raw.trim().toUpperCase().replace(/[^A-Z_]/g, "");
    const valid = VALID_CATEGORIES.includes(category) ? category : "OTHER";

    return NextResponse.json({ data: { category: valid } });
  } catch {
    return NextResponse.json({ data: { category: "OTHER" } });
  }
});
