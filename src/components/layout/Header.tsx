"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { LogOut, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { ExportButton } from "@/components/shared/ExportButton";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 font-semibold text-lg">
          <CheckSquare className="h-5 w-5 text-primary" />
          <span>TodoApp</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session?.user?.name && (
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session.user.name}
            </span>
          )}
          <ExportButton />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
