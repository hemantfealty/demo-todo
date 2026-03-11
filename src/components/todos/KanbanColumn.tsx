"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types";
import type { TodoStatus } from "@/types";

interface KanbanColumnProps {
  status: TodoStatus;
  label: string;
  color: string;
  todos: Todo[];
  children: React.ReactNode;
}

export function KanbanColumn({ status, label, color, todos, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border bg-muted/30 min-h-[300px] transition-colors",
        isOver && "bg-muted/60 border-primary/40"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3 border-b">
        <div className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <h3 className="font-semibold text-sm">{label}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{todos.length}</span>
      </div>

      {/* Cards */}
      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)]">
          {children}
          {todos.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
