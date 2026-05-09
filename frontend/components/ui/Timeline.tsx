"use client";

import { motion } from "framer-motion";
import { Check, Circle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type TimelineItemStatus =
  | "done"
  | "active"
  | "pending"
  | "blocked"
  | "escalated";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  status: TimelineItemStatus;
  /** ISO date string or human-readable label. */
  date?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const statusConfig: Record<
  TimelineItemStatus,
  { icon: React.ElementType; dotClass: string; lineClass: string }
> = {
  done: {
    icon: Check,
    dotClass: "bg-success text-white",
    lineClass: "bg-success",
  },
  active: {
    icon: Loader2,
    dotClass: "bg-saffron text-white",
    lineClass: "bg-paper-dark",
  },
  pending: {
    icon: Circle,
    dotClass: "bg-paper-dark text-text-muted",
    lineClass: "bg-paper-dark",
  },
  blocked: {
    icon: AlertCircle,
    dotClass: "bg-danger text-white",
    lineClass: "bg-paper-dark",
  },
  escalated: {
    icon: Clock,
    dotClass: "bg-warning text-white",
    lineClass: "bg-paper-dark",
  },
};

/** Vertical procedure timeline — the core visualization for step tracking. */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <ol className={cn("relative space-y-0", className)} aria-label="Procedure timeline">
      {items.map((item, idx) => {
        const cfg = statusConfig[item.status];
        const Icon = cfg.icon;
        const isLast = idx === items.length - 1;

        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {/* Connector line */}
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5",
                  cfg.lineClass
                )}
                aria-hidden="true"
              />
            )}

            {/* Status dot */}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm",
                cfg.dotClass
              )}
              aria-label={item.status}
            >
              <Icon
                size={16}
                className={cn(item.status === "active" && "animate-spin")}
              />
            </span>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-3">
                <h3
                  className={cn(
                    "text-sm font-semibold leading-tight",
                    item.status === "done" && "text-success",
                    item.status === "active" && "text-saffron-dark",
                    item.status === "blocked" && "text-danger",
                    item.status === "escalated" && "text-warning",
                    item.status === "pending" && "text-text-muted"
                  )}
                >
                  {item.title}
                </h3>
                {item.date && (
                  <span className="text-xs text-text-muted">{item.date}</span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
