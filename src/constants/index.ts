import type { TodoCategory, TodoPriority, TodoStatus } from "@/types";

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES: { value: TodoCategory; label: string; emoji: string }[] = [
  { value: "WORK", label: "Work", emoji: "💼" },
  { value: "PERSONAL", label: "Personal", emoji: "👤" },
  { value: "HEALTH", label: "Health", emoji: "❤️" },
  { value: "SHOPPING", label: "Shopping", emoji: "🛒" },
  { value: "EDUCATION", label: "Education", emoji: "📚" },
  { value: "FINANCE", label: "Finance", emoji: "💰" },
  { value: "TRAVEL", label: "Travel", emoji: "✈️" },
  { value: "OTHER", label: "Other", emoji: "📌" },
];

// ─── Priorities ───────────────────────────────────────────────────────────────

export const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: "HIGH", label: "High", color: "text-red-500" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-500" },
  { value: "LOW", label: "Low", color: "text-green-500" },
];

// ─── Statuses ─────────────────────────────────────────────────────────────────

export const STATUSES: { value: TodoStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

// ─── File Upload ──────────────────────────────────────────────────────────────

export const ALLOWED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Misc ─────────────────────────────────────────────────────────────────────

export const UNDO_TIMEOUT_MS = 5000;
export const DEBOUNCE_DELAY_MS = 300;
