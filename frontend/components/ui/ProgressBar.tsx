"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Optional label shown above the bar. */
  label?: string;
  /** Show percentage text to the right. */
  showPercent?: boolean;
  className?: string;
}

/** Saffron progress bar for procedure completion tracking. */
export function ProgressBar({
  value,
  label,
  showPercent = true,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-text-primary">{label}</span>}
          {showPercent && (
            <span className="tabular-nums text-text-muted">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-paper-dark">
        <motion.div
          className="h-full rounded-full bg-saffron"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
