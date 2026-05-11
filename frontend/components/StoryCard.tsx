"use client";

import { motion } from "framer-motion";
import { CheckCircle, CalendarDays, IndianRupee, Quote } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Story {
  id: string;
  name: string;
  location: string;
  event: "death" | "marriage" | "birth" | "property";
  headline: string;
  summary: string;
  procedures_completed: number;
  days_taken: number;
  money_saved_inr: number;
  without_days: number;
  language: string;
  avatar_initials: string;
  verified: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  death: "Death & Estate",
  marriage: "Marriage",
  birth: "Birth",
  property: "Property",
};

const EVENT_COLOR: Record<string, string> = {
  death: "bg-paper border-paper-dark text-text-secondary",
  marriage: "bg-saffron-light/60 border-saffron/30 text-saffron-dark",
  birth: "bg-green-50 border-green-200 text-green-700",
  property: "bg-blue-50 border-blue-200 text-blue-700",
};

interface StoryCardProps {
  story: Story;
  compact?: boolean;
  index?: number;
}

export function StoryCard({ story, compact = false, index = 0 }: StoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={cn(
        "rounded-[var(--radius-lg)] border border-paper-dark bg-surface shadow-card",
        "flex flex-col gap-3 p-5",
        compact && "p-4 gap-2.5"
      )}
    >
      {/* Header: avatar + name + event badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-saffron text-sm font-bold text-white shadow-sm">
            {story.avatar_initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-navy">{story.name}</p>
              {story.verified && (
                <CheckCircle size={12} className="text-success" aria-label="Verified story" />
              )}
            </div>
            <p className="text-[11px] text-text-muted">{story.location}</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-block shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            EVENT_COLOR[story.event]
          )}
        >
          {EVENT_LABELS[story.event]}
        </span>
      </div>

      {/* Quote icon + headline */}
      <div>
        <Quote size={14} className="mb-1 text-saffron/50" />
        <h3 className={cn("font-display text-navy leading-snug", compact ? "text-sm" : "text-base")}>
          {story.headline}
        </h3>
      </div>

      {/* Summary (hidden in compact) */}
      {!compact && (
        <p className="text-sm leading-relaxed text-text-secondary line-clamp-3">
          {story.summary}
        </p>
      )}

      {/* Stats row */}
      <div className="mt-auto flex items-center gap-4 text-xs text-text-muted border-t border-paper-dark pt-3">
        <span className="flex items-center gap-1">
          <CalendarDays size={11} className="text-saffron" />
          <strong className="text-navy">{story.days_taken}</strong> days
          <span className="text-text-muted/60 line-through ml-1">{story.without_days}</span>
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle size={11} className="text-success" />
          <strong className="text-navy">{story.procedures_completed}</strong> procedures
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <IndianRupee size={10} className="text-success" />
          <strong className="text-success">₹{story.money_saved_inr.toLocaleString("en-IN")}</strong>
          <span className="text-text-muted">saved</span>
        </span>
      </div>
    </motion.div>
  );
}
