import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-handler";
import { updateTodoSchema } from "@/validators/todo";
import { AppError } from "@/errors";

// Helper — ensure todo belongs to user
async function getTodoOrThrow(id: string, userId: string) {
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) throw new AppError("Todo not found", 404);
  if (todo.userId !== userId) throw new AppError("Forbidden", 403);
  return todo;
}

// GET /api/todos/[id]
export const GET = withAuth(async (_req, { userId, params }) => {
  const todo = await getTodoOrThrow(params!.id, userId);
  const full = await prisma.todo.findUnique({
    where: { id: todo.id },
    include: { subTasks: true, files: true },
  });
  return NextResponse.json({ data: full });
});

// PUT /api/todos/[id] — full update
export const PUT = withAuth(async (req, { userId, params }) => {
  await getTodoOrThrow(params!.id, userId);

  const body = await req.json();
  const parsed = updateTodoSchema.safeParse(body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const { dueDate, ...rest } = parsed.data;

  const updated = await prisma.todo.update({
    where: { id: params!.id },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: { subTasks: true, files: true },
  });

  return NextResponse.json({ data: updated });
});

// PATCH /api/todos/[id] — partial update (status, order)
export const PATCH = withAuth(async (req, { userId, params }) => {
  await getTodoOrThrow(params!.id, userId);

  const body = await req.json();
  const parsed = updateTodoSchema.safeParse(body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const { dueDate, ...rest } = parsed.data;

  const updated = await prisma.todo.update({
    where: { id: params!.id },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: { subTasks: true, files: true },
  });

  return NextResponse.json({ data: updated });
});

// DELETE /api/todos/[id]
export const DELETE = withAuth(async (_req, { userId, params }) => {
  await getTodoOrThrow(params!.id, userId);

  await prisma.todo.delete({ where: { id: params!.id } });

  return NextResponse.json({ message: "Deleted successfully" });
});
