import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-handler";
import { createTodoSchema } from "@/validators/todo";
import { AppError } from "@/errors";

// GET /api/todos — fetch all todos for current user (with filters)
export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const priority = searchParams.get("priority") || "";
  const status = searchParams.get("status") || "";

  const todos = await prisma.todo.findMany({
    where: {
      userId,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(category && category !== "ALL" && { category }),
      ...(priority && priority !== "ALL" && { priority }),
      ...(status && status !== "ALL" && { status }),
    },
    include: {
      subTasks: { orderBy: { id: "asc" } },
      files: { orderBy: { id: "asc" } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ data: todos });
});

// POST /api/todos — create new todo
export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const parsed = createTodoSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0].message, 400);
  }

  const { title, description, category, priority, dueDate } = parsed.data;

  // Get current max order
  const lastTodo = await prisma.todo.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const todo = await prisma.todo.create({
    data: {
      title,
      description,
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (lastTodo?.order ?? -1) + 1,
      userId,
    },
    include: { subTasks: true, files: true },
  });

  return NextResponse.json({ data: todo }, { status: 201 });
});
