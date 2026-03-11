"use client";

import { useState } from "react";
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { TodoForm } from "./TodoForm";
import { todoService } from "@/services/todoService";
import type { Todo, TodoFile, UpdateTodoInput, CreateTodoInput, TodoStatus } from "@/types";

interface KanbanBoardProps {
  todos: Todo[];
  onUpdate: (id: string, data: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFilesChange: (todoId: string, files: TodoFile[]) => void;
  onFilesUploaded: () => void;
  reorderTodos: (todos: Todo[]) => void;
}

const COLUMNS: { status: TodoStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "bg-gray-400" },
  { status: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-500" },
  { status: "COMPLETED", label: "Completed", color: "bg-green-500" },
];

export function KanbanBoard({ todos, onUpdate, onDelete, onFilesChange, onFilesUploaded, reorderTodos }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;

  function getTodosByStatus(status: TodoStatus): Todo[] {
    return todos.filter((t) => t.status === status);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTodo = todos.find((t) => t.id === activeId);
    if (!activeTodo) return;

    // Dropped on a column
    const isColumn = COLUMNS.some((c) => c.status === overId);
    if (isColumn) {
      const newStatus = overId as TodoStatus;
      if (activeTodo.status !== newStatus) {
        // Optimistic update
        const updated = todos.map((t) => t.id === activeId ? { ...t, status: newStatus } : t);
        reorderTodos(updated);
        try {
          await todoService.patch(activeId, { status: newStatus });
        } catch {
          toast.error("Failed to update status");
        }
      }
      return;
    }

    // Dropped on another card
    const overTodo = todos.find((t) => t.id === overId);
    if (!overTodo) return;

    if (activeTodo.status !== overTodo.status) {
      // Moving to a different column
      const newStatus = overTodo.status as TodoStatus;
      const updated = todos.map((t) => t.id === activeId ? { ...t, status: newStatus } : t);
      reorderTodos(updated);
      try {
        await todoService.patch(activeId, { status: newStatus });
      } catch {
        toast.error("Failed to update status");
      }
    } else {
      // Reordering within the same column
      const columnTodos = getTodosByStatus(activeTodo.status as TodoStatus);
      const oldIndex = columnTodos.findIndex((t) => t.id === activeId);
      const newIndex = columnTodos.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columnTodos, oldIndex, newIndex);
        // Rebuild full todos array with reordered column
        const otherTodos = todos.filter((t) => t.status !== activeTodo.status);
        reorderTodos([...otherTodos, ...reordered]);
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTodo = todos.find((t) => t.id === activeId);
    if (!activeTodo) return;

    // Check if dragging over a column
    const isColumn = COLUMNS.some((c) => c.status === overId);
    if (isColumn) {
      const newStatus = overId as TodoStatus;
      if (activeTodo.status !== newStatus) {
        const updated = todos.map((t) => t.id === activeId ? { ...t, status: newStatus } : t);
        reorderTodos(updated);
      }
      return;
    }

    // Dragging over another card in a different column
    const overTodo = todos.find((t) => t.id === overId);
    if (overTodo && activeTodo.status !== overTodo.status) {
      const updated = todos.map((t) => t.id === activeId ? { ...t, status: overTodo.status } : t);
      reorderTodos(updated);
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const columnTodos = getTodosByStatus(col.status);
            return (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                color={col.color}
                todos={columnTodos}
              >
                {columnTodos.map((todo) => (
                  <KanbanCard
                    key={todo.id}
                    todo={todo}
                    onClick={() => setEditTodo(todo)}
                  />
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTodo && (
            <div className="opacity-90 rotate-2 scale-105">
              <KanbanCard todo={activeTodo} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editTodo && (
        <TodoForm
          open={!!editTodo}
          onClose={() => setEditTodo(null)}
          onSubmit={async (data: CreateTodoInput) => {
            await onUpdate(editTodo.id, data);
            toast.success("Task updated!");
            setEditTodo(null);
          }}
          initialData={editTodo}
          onFilesChange={(files) => {
            onFilesChange(editTodo.id, files);
            onFilesUploaded();
          }}
        />
      )}
    </>
  );
}
