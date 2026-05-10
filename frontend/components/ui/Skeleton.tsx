"use client";

import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
  /** Render a circle instead of a rectangle. */
  circle?: boolean;
}

/** Shimmer loading placeholder for cards and text blocks. */
export function Skeleton({ className, circle }: SkeletonProps) {
  return (
    <span
      className={cn(
        "block animate-shimmer bg-gradient-to-r from-paper via-paper-dark/60 to-paper bg-[length:200%_100%]",
        circle ? "rounded-full" : "rounded-[var(--radius-md)]",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Pre-composed skeleton for a Card-shaped placeholder. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "space-y-4 rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-6 shadow-card",
        className
      )}
    >
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton circle className="h-8 w-8" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
