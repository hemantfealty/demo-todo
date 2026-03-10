"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Paperclip } from "lucide-react";
import { GenerateButton } from "@/components/ai/GenerateButton";
import { FileUpload } from "@/components/files/FileUpload";
import { fileService } from "@/services/fileService";
import { aiService } from "@/services/aiService";
import { CATEGORIES, PRIORITIES } from "@/constants";
import type { Todo, TodoFile, CreateTodoInput } from "@/types";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "application/msword", "text/plain"];

interface TodoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTodoInput) => Promise<{ id: string } | void>;
  initialData?: Todo;
  onFilesChange?: (files: TodoFile[]) => void;
  onCreatedWithFiles?: () => void;
}

const defaultForm: CreateTodoInput = {
  title: "",
  description: "",
  category: "OTHER",
  priority: "MEDIUM",
  dueDate: "",
};

export function TodoForm({ open, onClose, onSubmit, initialData, onFilesChange, onCreatedWithFiles }: TodoFormProps) {
  const [form, setForm] = useState<CreateTodoInput>(
    initialData
      ? {
          title: initialData.title,
          description: initialData.description ?? "",
          category: initialData.category,
          priority: initialData.priority,
          dueDate: initialData.dueDate
            ? new Date(initialData.dueDate).toISOString().split("T")[0]
            : "",
        }
      : defaultForm
  );
  const [loading, setLoading] = useState(false);
  const [suggestedSubTasks, setSuggestedSubTasks] = useState<string[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<TodoFile[]>(initialData?.files ?? []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onSubmit({ ...form, dueDate: form.dueDate || undefined });

      if (!initialData && result && "id" in result) {
        // Auto-create suggested subtasks
        if (suggestedSubTasks.length > 0) {
          await Promise.allSettled(
            suggestedSubTasks.map((title) =>
              fetch(`/api/todos/${result.id}/subtasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
              })
            )
          );
          toast.success(`${suggestedSubTasks.length} subtask(s) added!`);
        }

        // Upload queued files
        if (queuedFiles.length > 0) {
          await Promise.allSettled(queuedFiles.map((f) => fileService.upload(result.id, f)));
          toast.success(`${queuedFiles.length} file(s) uploaded!`);
          onCreatedWithFiles?.();
        }
      }

      setForm(defaultForm);
      setSuggestedSubTasks([]);
      setQueuedFiles([]);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  function handleFileQueue(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const invalid = selected.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) { toast.error("File type not allowed. Use PNG, JPG, PDF, DOC, or TXT."); return; }

    const tooBig = selected.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) { toast.error("File too large. Max 5MB per file."); return; }

    setQueuedFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGenerateDescription() {
    if (!form.title.trim()) { toast.warning("Enter a title first"); return; }
    try {
      const desc = await aiService.generateDescription(form.title);
      setForm((f) => ({ ...f, description: desc }));
      toast.success("Description generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI unavailable. Please fill in manually.");
    }
  }

  async function handleAutoCategorize() {
    if (!form.title.trim()) { toast.warning("Enter a title first"); return; }
    try {
      const category = await aiService.categorize(form.title);
      setForm((f) => ({ ...f, category }));
      toast.success("Category auto-detected!");
    } catch {
      toast.error("AI unavailable. Please select manually.");
    }
  }

  async function handleAutoPrioritize() {
    if (!form.title.trim()) { toast.warning("Enter a title first"); return; }
    try {
      const priority = await aiService.prioritize(form.title);
      setForm((f) => ({ ...f, priority }));
      toast.success("Priority auto-set!");
    } catch {
      toast.error("AI unavailable. Please select manually.");
    }
  }

  async function handleSuggestSubTasks() {
    if (!form.title.trim()) { toast.warning("Enter a title first"); return; }
    try {
      const suggestions = await aiService.suggest(form.title);
      if (suggestions.length === 0) { toast.warning("No suggestions returned"); return; }
      setSuggestedSubTasks(suggestions);
      toast.success(`${suggestions.length} subtasks suggested!`);
    } catch {
      toast.error("AI unavailable. Please add subtasks manually.");
    }
  }

  const noTitle = !form.title.trim();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          {/* Description + AI Generate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <GenerateButton onClick={handleGenerateDescription} disabled={noTitle} label="AI Generate" />
            </div>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Category + Priority with AI */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <GenerateButton onClick={handleAutoCategorize} disabled={noTitle} label="Auto" className="h-6 text-xs px-2" />
              </div>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as CreateTodoInput["category"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Priority</Label>
                <GenerateButton onClick={handleAutoPrioritize} disabled={noTitle} label="Auto" className="h-6 text-xs px-2" />
              </div>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as CreateTodoInput["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          {/* AI Sub-task Suggestions — only on create */}
          {!initialData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sub-task Suggestions</Label>
                <GenerateButton onClick={handleSuggestSubTasks} disabled={noTitle} label="AI Suggest" />
              </div>
              {suggestedSubTasks.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                  {suggestedSubTasks.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {s}
                      <button type="button" onClick={() => setSuggestedSubTasks((p) => p.filter((_, j) => j !== i))}>
                        <X className="h-3 w-3 ml-1 hover:text-destructive" />
                      </button>
                    </Badge>
                  ))}
                  <p className="w-full text-xs text-muted-foreground mt-1">
                    These will be added as subtasks when you create the task.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Attachments — queue for new task, live for edit */}
          <div className="space-y-2">
            <Label>Attachments</Label>
            {initialData ? (
              <FileUpload
                todoId={initialData.id}
                files={attachedFiles}
                onFilesChange={(files) => {
                  setAttachedFiles(files);
                  onFilesChange?.(files);
                }}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileQueue}
                />
                {queuedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {queuedFiles.map((f, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
                        <Paperclip className="h-3 w-3" />
                        {f.name}
                        <button type="button" onClick={() => setQueuedFiles((p) => p.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3 ml-1 hover:text-destructive" />
                        </button>
                      </Badge>
                    ))}
                    <p className="w-full text-xs text-muted-foreground">
                      These will be uploaded when you create the task.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <Separator />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
