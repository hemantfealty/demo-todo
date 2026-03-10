"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
  progress: number;
}

export function ProgressBar({ completed, total, progress }: ProgressBarProps) {
  if (total === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{completed} of {total} tasks completed</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
