"use client";

import { useState, useRef, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, List, Columns3, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TodoItem } from "./TodoItem";
import { TodoForm } from "./TodoForm";
import { KanbanBoard } from "./KanbanBoard";
import { DashboardAnalytics } from "@/components/analytics/DashboardAnalytics";
import { ProgressBar } from "./ProgressBar";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { useTodos } from "@/hooks/useTodos";
import { useDebounce } from "@/hooks/useDebounce";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { todoService } from "@/services/todoService";
import { cn } from "@/lib/utils";
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoFilters } from "@/types";

type ViewMode = "list" | "kanban" | "analytics";

function SortableTodoItem({
  todo,
  onUpdate,
  onDelete,
  onFilesChange,
  onFilesUploaded,
}: {
  todo: Todo;
  onUpdate: (id: string, data: UpdateTodoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFilesChange: (todoId: string, files: import("@/types").TodoFile[]) => void;
  onFilesUploaded: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TodoItem
        todo={todo}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onFilesChange={(files) => onFilesChange(todo.id, files)}
        onFilesUploaded={onFilesUploaded}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function TodoList() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TodoFilters>({ category: "ALL", priority: "ALL", status: "ALL" });
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const activeFilters: TodoFilters = { ...filters, search: debouncedSearch };

  const {
    todos,
    loading,
    progress,
    completedCount,
    total,
    createTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
    updateTodoFiles,
    silentRefetch,
  } = useTodos(activeFilters);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      handler: useCallback(() => setCreateOpen(true), []),
    },
    {
      key: "k",
      ctrl: true,
      handler: useCallback(() => searchRef.current?.focus(), []),
    },
    {
      key: "Escape",
      handler: useCallback(() => setCreateOpen(false), []),
    },
  ]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);
    reorderTodos(reordered);

    try {
      await Promise.all(
        reordered.map((todo, index) => todoService.patch(todo.id, { order: index }))
      );
    } catch {
      toast.error("Failed to save order");
    }
  }

  async function handleCreate(data: CreateTodoInput) {
    try {
      const todo = await createTodo(data);
      toast.success("Task created!");
      return todo;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    }
  }

  async function handleUpdate(id: string, data: UpdateTodoInput) {
    try {
      await updateTodo(id, data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    }
  }

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await deleteTodo(id);
      toast("Task deleted");
    } catch {
      setDeletingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.error("Failed to delete task");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const isFiltered = !!(debouncedSearch || filters.category !== "ALL" || filters.priority !== "ALL" || filters.status !== "ALL");
  const isTrulyEmpty = !isFiltered && total === 0 && !loading;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <ProgressBar completed={completedCount} total={total} progress={progress} />

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} inputRef={searchRef} />
        </div>
      </div>
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            Tasks{" "}
            <span className="text-muted-foreground font-normal text-sm">({total})</span>
          </h2>

          {/* View Toggle */}
          {!isTrulyEmpty && (
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors",
                  viewMode === "kanban"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
                Board
              </button>
              <button
                onClick={() => setViewMode("analytics")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors",
                  viewMode === "analytics"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Stats
              </button>
            </div>
          )}
        </div>

        {!isTrulyEmpty && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Task <span className="ml-1 text-xs opacity-60 hidden sm:inline">(N)</span>
          </Button>
        )}
      </div>

      {/* Empty state */}
      {todos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">
            {isFiltered ? "No tasks match your filters" : "No tasks yet"}
          </p>
          <p className="text-sm mt-1">
            {isFiltered ? "Try adjusting your search or filters" : ""}
          </p>
          {isTrulyEmpty && (
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create Task
            </Button>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && todos.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {todos.filter((t) => !deletingIds.has(t.id)).map((todo) => (
                <SortableTodoItem
                  key={todo.id}
                  todo={todo}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onFilesChange={updateTodoFiles}
                  onFilesUploaded={silentRefetch}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <DashboardAnalytics todos={todos} />
      )}

      {/* Kanban View */}
      {viewMode === "kanban" && todos.length > 0 && (
        <KanbanBoard
          todos={todos.filter((t) => !deletingIds.has(t.id))}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onFilesChange={updateTodoFiles}
          onFilesUploaded={silentRefetch}
          reorderTodos={reorderTodos}
        />
      )}

      <TodoForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        onCreatedWithFiles={silentRefetch}
      />
    </div>
  );
}
