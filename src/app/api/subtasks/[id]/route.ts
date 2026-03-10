import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api-handler";
import { AppError } from "@/errors";
import { z } from "zod";

const updateSubTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

async function getSubTaskOrThrow(id: string, userId: string) {
  const subTask = await prisma.subTask.findUnique({
    where: { id },
    include: { todo: { select: { userId: true } } },
  });
  if (!subTask) throw new AppError("SubTask not found", 404);
  if (subTask.todo.userId !== userId) throw new AppError("Forbidden", 403);
  return subTask;
}

// PUT /api/subtasks/[id]
export const PUT = withAuth(async (req: NextRequest, { userId, params }) => {
  await getSubTaskOrThrow(params!.id, userId);

  const body = await req.json();
  const parsed = updateSubTaskSchema.safeParse(body);
  if (!parsed.success) throw new AppError(parsed.error.issues[0].message, 400);

  const updated = await prisma.subTask.update({
    where: { id: params!.id },
    data: parsed.data,
  });

  return NextResponse.json({ data: updated });
});

// DELETE /api/subtasks/[id]
export const DELETE = withAuth(async (_req, { userId, params }) => {
  await getSubTaskOrThrow(params!.id, userId);

  await prisma.subTask.delete({ where: { id: params!.id } });

  return NextResponse.json({ message: "Deleted" });
});
