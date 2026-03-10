import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-handler";
import { AppError } from "@/errors";
import { z } from "zod";

const createSubTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

// GET /api/todos/[id]/subtasks
export const GET = withAuth(async (_req, { userId, params }) => {
  const todo = await prisma.todo.findUnique({ where: { id: params!.id } });
  if (!todo) throw new AppError("Todo not found", 404);
  if (todo.userId !== userId) throw new AppError("Forbidden", 403);

  const subTasks = await prisma.subTask.findMany({
    where: { todoId: params!.id },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ data: subTasks });
});

// POST /api/todos/[id]/subtasks
export const POST = withAuth(async (req: NextRequest, { userId, params }) => {
  const todo = await prisma.todo.findUnique({ where: { id: params!.id } });
  if (!todo) throw new AppError("Todo not found", 404);
  if (todo.userId !== userId) throw new AppError("Forbidden", 403);

  const body = await req.json();
  const parsed = createSubTaskSchema.safeParse(body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const subTask = await prisma.subTask.create({
    data: { title: parsed.data.title, todoId: params!.id },
  });

  return NextResponse.json({ data: subTask }, { status: 201 });
});
