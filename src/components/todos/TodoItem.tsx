"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, GripVertical, Calendar, CheckCircle2, Circle, Clock, ChevronDown, FileText, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CATEGORIES, PRIORITIES } from "@/constants";
import { TodoForm } from "./TodoForm";
import { SubTaskList } from "./SubTaskList";
import { FileUpload } from "@/components/files/FileUpload";
import type { Todo, TodoFile, UpdateTodoInput, TodoStatus, CreateTodoInput } from "@/types";

interface TodoItemProps {
  todo: Todo;
  onUpdate: (id: string, data: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFilesChange: (files: TodoFile[]) => void;
  onFilesUploaded: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const STATUS_CYCLE: Record<TodoStatus, TodoStatus> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: "PENDING",
};

const STATUS_ICON: Record<TodoStatus, React.ReactNode> = {
  PENDING: <Circle className="h-5 w-5 text-muted-foreground" />,
  IN_PROGRESS: <Clock className="h-5 w-5 text-yellow-500" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5 text-green-500" />,
};

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  MEDIUM: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function TodoItem({ todo, onUpdate, onDelete, onFilesChange, onFilesUploaded, dragHandleProps }: TodoItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const category = CATEGORIES.find((c) => c.value === todo.category);
  const priority = PRIORITIES.find((p) => p.value === todo.priority);

  function cycleStatus() {
    const next = STATUS_CYCLE[todo.status as TodoStatus];
    onUpdate(todo.id, { status: next });
  }

  function handleDelete() {
    onDelete(todo.id);
  }

  async function handleDownload(url: string, fileName: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank");
    }
  }

  const isOverdue =
    todo.dueDate &&
    todo.status !== "COMPLETED" &&
    new Date(todo.dueDate) < new Date();

  const completedSubTasks = todo.subTasks.filter((s) => s.completed).length;

  return (
    <>
      <Card className={cn("group transition-shadow hover:shadow-md", todo.status === "COMPLETED" && "opacity-60")}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <div
              {...dragHandleProps}
              className="mt-0.5 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Status Toggle */}
            <button onClick={cycleStatus} className="mt-0.5 flex-shrink-0 cursor-pointer hover:scale-110 transition-transform">
              {STATUS_ICON[todo.status as TodoStatus]}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium leading-snug", todo.status === "COMPLETED" && "line-through text-muted-foreground")}>
                {todo.title}
              </p>
              {todo.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{todo.description}</p>
              )}

              {/* File thumbnails — always visible */}
              {todo.files.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {todo.files.map((file) =>
                    file.fileType.startsWith("image/") ? (
                      <a key={file.id} href={file.filePath} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.filePath}
                          alt={file.fileName}
                          className="h-10 w-10 object-cover rounded border border-border hover:opacity-80 transition-opacity"
                        />
                      </a>
                    ) : (
                      <a
                        key={file.id}
                        href={`/api/download?url=${encodeURIComponent(file.filePath)}&name=${encodeURIComponent(file.fileName)}`}
                        download={file.fileName}
                        className="flex items-center gap-1 h-10 px-2 bg-muted rounded border border-border text-xs text-muted-foreground hover:text-foreground transition-colors max-w-[120px] cursor-pointer"
                      >
                        {file.fileType === "application/pdf" ? (
                          <FileText className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                        ) : (
                          <File className="h-3.5 w-3.5 flex-shrink-0" />
                        )}
                        <span className="truncate">{file.fileName}</span>
                      </a>
                    )
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {category?.emoji} {category?.label}
                </Badge>

                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", PRIORITY_BADGE[todo.priority])}>
                  {priority?.label}
                </span>

                {todo.dueDate && (
                  <span className={cn("flex items-center gap-1 text-xs", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                    <Calendar className="h-3 w-3" />
                    {new Date(todo.dueDate).toLocaleDateString()}
                    {isOverdue && " (Overdue)"}
                  </span>
                )}

                {/* Subtask toggle button */}
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                  {todo.subTasks.length > 0
                    ? `${completedSubTasks}/${todo.subTasks.length} subtasks`
                    : "Subtasks"}
                  {todo.files.length > 0 && (
                    <span className="ml-1 text-muted-foreground">· {todo.files.length} file{todo.files.length !== 1 ? "s" : ""}</span>
                  )}
                </button>
              </div>

              {/* SubTask List + Files — collapsible */}
              {expanded && (
                <div className="mt-3 space-y-4">
                  <SubTaskList todoId={todo.id} initialSubTasks={todo.subTasks} />
                  <FileUpload todoId={todo.id} files={todo.files} onFilesChange={(files) => {
                    onFilesChange(files);
                    onFilesUploaded();
                  }} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TodoForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data: CreateTodoInput) => {
          await onUpdate(todo.id, data);
          toast.success("Task updated!");
        }}
        initialData={todo}
        onFilesChange={(files) => {
          onFilesChange(files);
          onFilesUploaded();
        }}
      />
    </>
  );
}
