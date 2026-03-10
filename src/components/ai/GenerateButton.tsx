"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GenerateButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function GenerateButton({ onClick, disabled, label = "Generate", className }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handle}
      disabled={disabled || loading}
      className={cn("gap-1.5", className)}
    >
      <Sparkles className={cn("h-3.5 w-3.5", loading && "animate-pulse")} />
      {loading ? "Generating..." : label}
    </Button>
  );
}
