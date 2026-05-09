"use client";

import { cn } from "@/lib/cn";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Accessible label for screen readers. */
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

/** Saffron-accented spinning loader. */
export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading",
}: LoadingSpinnerProps) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} role="status">
      <span
        className={cn(
          "animate-spin rounded-full border-paper-dark border-t-saffron",
          sizeMap[size]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
