"use client";

import { motion } from "framer-motion";
import {
  Check,
  Circle,
  AlertCircle,
  Clock,
  Loader2,
  ArrowRight,
  CalendarDays,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, Badge, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ProcedurePlan, Procedure } from "@/lib/api";

interface ProcedureTimelineProps {
  plan: ProcedurePlan;
  selectedProcedure: string | null;
  onSelect: (id: string) => void;
}

/* ── Status config ── */
type ProcStatus = "pending" | "in_progress" | "done" | "blocked" | "escalated";

const statusConfig: Record<
  ProcStatus,
  { icon: React.ElementType; dotClass: string; lineClass: string }
> = {
  done: {
    icon: Check,
    dotClass: "bg-success text-white",
    lineClass: "bg-success",
  },
  in_progress: {
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

function formatProcedureName(id: string): string {
  return id
    .replace(/^tn_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function computeProgress(procedures: Procedure[]): number {
  if (procedures.length === 0) return 0;
  const done = procedures.filter((p) => p.status === "done").length;
  return Math.round((done / procedures.length) * 100);
}

export default function ProcedureTimeline({
  plan,
  selectedProcedure,
  onSelect,
}: ProcedureTimelineProps) {
  const progress = computeProgress(plan.procedures);

  return (
    <div className="p-6">
      {/* ── Header Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 space-y-4"
      >
        <h2 className="font-display text-2xl text-navy">Your Procedure Plan</h2>

        <ProgressBar value={progress} label="Overall Progress" />

        <div className="grid grid-cols-2 gap-3">
          {/* With NyayaMitra */}
          <Card className="border-saffron/20 bg-saffron-light/50">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-saffron-dark">
                With NyayaMitra
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <CalendarDays size={14} className="text-saffron-dark" />
                <span className="font-display text-2xl text-navy">
                  ~{plan.total_estimated_days}
                </span>
                <span className="text-sm text-text-secondary">days</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-text-secondary">
                <IndianRupee size={12} />
                <span>{plan.total_estimated_cost_inr} in fees</span>
              </div>
            </CardContent>
          </Card>

          {/* Without help */}
          <Card className="bg-paper/60">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Without help
              </p>
              <div className="mt-1 flex items-baseline gap-1 line-through opacity-50">
                <CalendarDays size={14} className="text-text-muted" />
                <span className="font-display text-2xl text-text-muted">
                  ~{plan.without_nyayamitra_baseline_days}
                </span>
                <span className="text-sm text-text-muted">days</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-text-muted line-through opacity-50">
                <IndianRupee size={12} />
                <span>{plan.without_nyayamitra_baseline_cost_inr} in fees</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ── Timeline ── */}
      <ol className="relative space-y-0" aria-label="Procedure timeline">
        {plan.procedures.map((proc, idx) => {
          const status = (proc.status as ProcStatus) || "pending";
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          const isLast = idx === plan.procedures.length - 1;
          const isSelected = selectedProcedure === proc.procedure_id;

          return (
            <motion.li
              key={proc.procedure_id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.35 }}
              className="relative flex gap-4 pb-6 last:pb-0 cursor-pointer group"
              onClick={() => onSelect(proc.procedure_id)}
            >
              {/* Connector line */}
              {!isLast && (
                <span
                  className={cn(
                    "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5",
                    cfg.lineClass
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Status dot */}
              <span
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm text-xs font-bold transition-shadow duration-[var(--duration-base)]",
                  cfg.dotClass,
                  status === "in_progress" && "animate-glow-pulse",
                  status === "done" && "animate-stamp",
                  "group-hover:shadow-card-hover"
                )}
              >
                {status === "done" || status === "blocked" || status === "escalated" ? (
                  <Icon size={16} />
                ) : status === "in_progress" ? (
                  <Icon size={16} className="animate-spin" />
                ) : (
                  <span>{proc.order}</span>
                )}
              </span>

              {/* Content card */}
              <div
                className={cn(
                  "flex-1 rounded-[var(--radius-md)] border p-3 transition-all duration-[var(--duration-fast)]",
                  isSelected
                    ? "border-saffron bg-saffron-light/30 shadow-card"
                    : "border-paper-dark bg-surface group-hover:border-saffron/40 group-hover:shadow-card"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-navy">
                      {formatProcedureName(proc.procedure_id)}
                    </h3>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary line-clamp-2">
                      {proc.why_this_is_needed}
                    </p>
                  </div>
                  <Badge status={status as any} className="shrink-0">
                    {proc.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Dependencies */}
                {proc.depends_on_procedure_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {proc.depends_on_procedure_ids.map((dep) => (
                      <span
                        key={dep}
                        className="inline-flex items-center gap-0.5 rounded-full bg-paper px-2 py-0.5 text-[10px] text-text-muted"
                      >
                        <ArrowRight size={8} />
                        {formatProcedureName(dep)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Day estimate bar */}
                <div className="mt-2.5 flex items-center gap-2 text-[10px] text-text-muted">
                  <span className="tabular-nums">Day {proc.estimated_start_after_days}</span>
                  <div className="flex-1 h-1 rounded-full bg-paper-dark overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.7, delay: idx * 0.1 + 0.3 }}
                      className="h-full rounded-full bg-saffron/50"
                    />
                  </div>
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
