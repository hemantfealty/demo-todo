"use client";

import { useState, useEffect, useCallback } from "react";
import { todoService } from "@/services/todoService";
import type { Todo, TodoFile, TodoFilters, CreateTodoInput, UpdateTodoInput } from "@/types";
import { toast } from "sonner";

export function useTodos(filters: TodoFilters = {}) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await todoService.getAll(filters);
      setTodos(data);
    } catch {
      toast.error("Failed to load todos");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  // Refetch without showing loading spinner — used after file changes
  const silentRefetch = useCallback(async () => {
    try {
      const data = await todoService.getAll(filters);
      setTodos(data);
    } catch {
      // silent
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = async (input: CreateTodoInput) => {
    const todo = await todoService.create(input);
    setTodos((prev) => [...prev, todo]);
    return todo;
  };

  const updateTodo = async (id: string, input: UpdateTodoInput) => {
    const updated = await todoService.update(id, input);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const patchTodo = async (id: string, input: UpdateTodoInput) => {
    const updated = await todoService.patch(id, input);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const deleteTodo = async (id: string) => {
    await todoService.delete(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const reorderTodos = (newOrder: Todo[]) => {
    setTodos(newOrder);
  };

  const updateTodoFiles = (todoId: string, files: TodoFile[]) => {
    setTodos((prev) => prev.map((t) => t.id === todoId ? { ...t, files } : t));
  };

  const completedCount = todos.filter((t) => t.status === "COMPLETED").length;
  const progress = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return {
    todos,
    loading,
    progress,
    completedCount,
    total: todos.length,
    refetch: fetchTodos,
    silentRefetch,
    createTodo,
    updateTodo,
    patchTodo,
    deleteTodo,
    reorderTodos,
    updateTodoFiles,
  };
}
