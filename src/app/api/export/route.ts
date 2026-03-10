import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/errors";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  if (format !== "csv" && format !== "json") {
    throw new AppError("format must be csv or json", 400);
  }

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: { subTasks: true, files: true },
  });

  if (format === "json") {
    const blob = JSON.stringify(todos, null, 2);
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="todos-${Date.now()}.json"`,
      },
    });
  }

  // CSV
  const escape = (val: string | null | undefined) =>
    `"${(val ?? "").replace(/"/g, '""')}"`;

  const header = ["id", "title", "description", "category", "priority", "status", "dueDate", "createdAt", "subTasks"].join(",");

  const rows = todos.map((t) => {
    const subTaskTitles = t.subTasks.map((s) => s.title).join(" | ");
    return [
      escape(t.id),
      escape(t.title),
      escape(t.description),
      escape(t.category),
      escape(t.priority),
      escape(t.status),
      escape(t.dueDate?.toISOString() ?? ""),
      escape(t.createdAt.toISOString()),
      escape(subTaskTitles),
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="todos-${Date.now()}.csv"`,
    },
  });
});
