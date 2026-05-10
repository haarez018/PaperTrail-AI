"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide animate-badge-enter",
  {
    variants: {
      status: {
        pending: "bg-gray-100 text-pending border border-gray-200",
        active: "bg-saffron-light text-saffron-dark border border-saffron/20",
        in_progress: "bg-amber-50 text-amber-700 border border-amber-200",
        done: "bg-green-50 text-success border border-green-200",
        blocked: "bg-red-50 text-danger border border-red-200",
        escalated: "bg-orange-50 text-warning border border-orange-200",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/** Status badge with bounce-in entrance animation. */
export function Badge({ className, status, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)} {...props} />
  );
}
