"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/constants";
import type { TodoFilters } from "@/types";

interface FilterBarProps {
  filters: TodoFilters;
  onChange: (filters: TodoFilters) => void;
}

const isActive = (filters: TodoFilters) =>
  (filters.category && filters.category !== "ALL") ||
  (filters.priority && filters.priority !== "ALL") ||
  (filters.status && filters.status !== "ALL");

export function FilterBar({ filters, onChange }: FilterBarProps) {
  function reset() {
    onChange({ ...filters, category: "ALL", priority: "ALL", status: "ALL" });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Category */}
      <Select
        value={filters.category ?? "ALL"}
        onValueChange={(v) => onChange({ ...filters, category: v as TodoFilters["category"] })}
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.emoji} {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority ?? "ALL"}
        onValueChange={(v) => onChange({ ...filters, priority: v as TodoFilters["priority"] })}
      >
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status ?? "ALL"}
        onValueChange={(v) => onChange({ ...filters, status: v as TodoFilters["status"] })}
      >
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {isActive(filters) && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={reset}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
