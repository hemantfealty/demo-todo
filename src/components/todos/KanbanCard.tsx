"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORIES, PRIORITIES } from "@/constants";
import type { Todo } from "@/types";

interface KanbanCardProps {
  todo: Todo;
  onClick: () => void;
}

const PRIORITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
};

export function KanbanCard({ todo, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    data: { status: todo.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const category = CATEGORIES.find((c) => c.value === todo.category);
  const isOverdue =
    todo.dueDate &&
    todo.status !== "COMPLETED" &&
    new Date(todo.dueDate) < new Date();

  const completedSubTasks = todo.subTasks.filter((s) => s.completed).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-background rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/20"
      )}
    >
      {/* Title */}
      <p className={cn(
        "font-medium text-sm leading-snug",
        todo.status === "COMPLETED" && "line-through text-muted-foreground"
      )}>
        {todo.title}
      </p>

      {/* Description preview */}
      {todo.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>
      )}

      {/* Image thumbnails */}
      {todo.files.some((f) => f.fileType.startsWith("image/")) && (
        <div className="flex gap-1 mt-2">
          {todo.files
            .filter((f) => f.fileType.startsWith("image/"))
            .slice(0, 3)
            .map((file) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={file.id}
                src={file.filePath}
                alt={file.fileName}
                className="h-8 w-8 object-cover rounded border border-border"
              />
            ))}
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {/* Priority dot */}
        <div className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[todo.priority])} title={todo.priority} />

        {/* Category */}
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {category?.emoji} {category?.label}
        </Badge>

        {/* Due date */}
        {todo.dueDate && (
          <span className={cn(
            "flex items-center gap-0.5 text-[10px]",
            isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
          )}>
            <Calendar className="h-2.5 w-2.5" />
            {new Date(todo.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}

        {/* Subtasks count */}
        {todo.subTasks.length > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {completedSubTasks}/{todo.subTasks.length}
          </span>
        )}

        {/* File count */}
        {todo.files.length > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <FileText className="h-2.5 w-2.5" />
            {todo.files.length}
          </span>
        )}
      </div>
    </div>
  );
}
