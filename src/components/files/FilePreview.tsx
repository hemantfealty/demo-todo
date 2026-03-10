"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, FileText, File } from "lucide-react";
import { fileService } from "@/services/fileService";
import type { TodoFile } from "@/types";

interface FilePreviewProps {
  files: TodoFile[];
  onDelete: (id: string) => void;
}

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (fileType.startsWith("image/")) return null;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePreview({ files, onDelete }: FilePreviewProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fileService.delete(id);
      onDelete(id);
      toast.success("File removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeleting(null);
    }
  }

  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="relative group flex items-center gap-1.5 bg-muted rounded-md px-2 py-1.5 text-xs max-w-[160px]"
        >
          {file.fileType.startsWith("image/") ? (
            <a href={file.filePath} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={file.filePath}
                alt={file.fileName}
                className="h-8 w-8 object-cover rounded"
              />
            </a>
          ) : (
            <a
              href={file.filePath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline truncate"
            >
              <FileIcon fileType={file.fileType} />
              <span className="truncate">{file.fileName}</span>
            </a>
          )}
          <span className="text-muted-foreground whitespace-nowrap">{formatSize(file.fileSize)}</span>
          <button
            onClick={() => handleDelete(file.id)}
            disabled={deleting === file.id}
            className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
