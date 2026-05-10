"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/cn";

export type Theme = "light" | "dark" | "system";

/** Compact light/dark mode toggle. */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("nyayamitra-theme") as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "light") {
      root.classList.add("light");
    }
  };

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("nyayamitra-theme", next);
  };

  // Prevent hydration mismatch — render a neutral icon until mounted
  if (!mounted) {
    return (
      <button
        className={cn(
          "rounded-[var(--radius-sm)] p-1.5 text-text-muted transition-colors hover:bg-paper hover:text-text-primary",
          className
        )}
        aria-label="Toggle theme"
      >
        <Monitor size={16} />
      </button>
    );
  }

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={toggle}
      className={cn(
        "rounded-[var(--radius-sm)] p-1.5 text-text-muted transition-colors hover:bg-paper hover:text-text-primary",
        className
      )}
      aria-label={`Theme: ${theme}. Click to toggle.`}
      title={`Theme: ${theme}`}
    >
      {isDark ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
