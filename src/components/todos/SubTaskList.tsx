"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { subTaskService } from "@/services/subTaskService";
import type { SubTask } from "@/types";

interface SubTaskListProps {
  todoId: string;
  initialSubTasks: SubTask[];
}

export function SubTaskList({ todoId, initialSubTasks }: SubTaskListProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>(initialSubTasks);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const created = await subTaskService.create(todoId, newTitle.trim());
      setSubTasks((prev) => [...prev, created]);
      setNewTitle("");
      setShowInput(false);
    } catch {
      toast.error("Failed to add subtask");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(subTask: SubTask) {
    try {
      const updated = await subTaskService.update(subTask.id, { completed: !subTask.completed });
      setSubTasks((prev) => prev.map((s) => (s.id === subTask.id ? updated : s)));
    } catch {
      toast.error("Failed to update subtask");
    }
  }

  async function handleDelete(id: string) {
    try {
      await subTaskService.delete(id);
      setSubTasks((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete subtask");
    }
  }

  const completed = subTasks.filter((s) => s.completed).length;

  return (
    <div className="mt-3 space-y-2 pl-8 border-l-2 border-border ml-8">
      {/* Sub-task count */}
      {subTasks.length > 0 && (
        <p className="text-xs text-muted-foreground font-medium">
          Subtasks — {completed}/{subTasks.length} done
        </p>
      )}

      {/* Subtask items */}
      {subTasks.map((subTask) => (
        <div key={subTask.id} className="flex items-center gap-2 group">
          <button
            onClick={() => handleToggle(subTask)}
            className={cn(
              "flex-shrink-0 h-4 w-4 rounded border transition-colors",
              subTask.completed
                ? "bg-primary border-primary"
                : "border-muted-foreground hover:border-primary"
            )}
          >
            {subTask.completed && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>
          <span className={cn("text-sm flex-1", subTask.completed && "line-through text-muted-foreground")}>
            {subTask.title}
          </span>
          <button
            onClick={() => handleDelete(subTask.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      {/* Add input */}
      {showInput ? (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            autoFocus
            placeholder="Subtask title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="h-7 text-sm"
            onKeyDown={(e) => e.key === "Escape" && setShowInput(false)}
          />
          <Button type="submit" size="sm" className="h-7 px-2" disabled={adding}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => setShowInput(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add subtask
        </button>
      )}
    </div>
  );
}
