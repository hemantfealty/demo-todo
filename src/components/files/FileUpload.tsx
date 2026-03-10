"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, Loader2 } from "lucide-react";
import { fileService } from "@/services/fileService";
import { FilePreview } from "./FilePreview";
import type { TodoFile } from "@/types";

interface FileUploadProps {
  todoId: string;
  files: TodoFile[];
  onFilesChange: (files: TodoFile[]) => void;
}

const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "application/msword", "text/plain"];

export function FileUpload({ todoId, files, onFilesChange }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const invalid = selected.find((f) => !ALLOWED.includes(f.type));
    if (invalid) {
      toast.error("File type not allowed. Use PNG, JPG, PDF, DOC, or TXT.");
      return;
    }

    const tooBig = selected.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error("File too large. Max 5MB per file.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await Promise.all(selected.map((f) => fileService.upload(todoId, f)));
      onFilesChange([...files, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
          {uploading ? "Uploading..." : "Attach files"}
        </button>
        <span className="text-xs text-muted-foreground">PNG, JPG, PDF, DOC, TXT · max 5MB</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleChange}
      />

      <FilePreview
        files={files}
        onDelete={(id) => onFilesChange(files.filter((f) => f.id !== id))}
      />
    </div>
  );
}
