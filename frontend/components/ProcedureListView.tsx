"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Procedure } from "@/lib/api";

interface ProcedureListViewProps {
  procedures: Procedure[];
  selectedProcedure: string | null;
  onSelect: (id: string) => void;
}

function formatName(id: string) {
  return id.replace(/^tn_/, "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Compact table/list view of all procedures — a simple alternative
 * to the timeline and graph views.
 */
export function ProcedureListView({ procedures, selectedProcedure, onSelect }: ProcedureListViewProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-paper-dark">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 border-b border-paper-dark bg-paper px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        <span>Procedure</span>
        <span className="hidden sm:block">Start</span>
        <span>Status</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-paper-dark">
        {procedures.map((proc, i) => {
          const isSelected = selectedProcedure === proc.procedure_id;
          return (
            <motion.button
              key={proc.procedure_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelect(proc.procedure_id)}
              className={cn(
                "grid grid-cols-[2fr_1fr_1fr_auto] w-full gap-2 px-4 py-3 text-left text-sm",
                "transition-colors hover:bg-paper/60 group",
                isSelected && "bg-saffron-light/30"
              )}
            >
              <div>
                <p className={cn("font-semibold", isSelected ? "text-saffron-dark" : "text-navy")}>
                  <span className="mr-2 text-xs text-text-muted font-normal">{proc.order}.</span>
                  {formatName(proc.procedure_id)}
                </p>
                {proc.depends_on_procedure_ids.length > 0 && (
                  <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">
                    Needs:{" "}
                    {proc.depends_on_procedure_ids
                      .map((d) => formatName(d))
                      .join(", ")}
                  </p>
                )}
              </div>

              <span className="hidden sm:flex items-center gap-1 text-xs text-text-muted self-center">
                <CalendarDays size={11} />
                Day {proc.estimated_start_after_days}
              </span>

              <div className="self-center">
                <Badge status={proc.status as any} className="text-[10px]">
                  {proc.status.replace("_", " ")}
                </Badge>
              </div>

              <ArrowRight
                size={14}
                className={cn(
                  "self-center text-text-muted transition-transform",
                  "group-hover:translate-x-1",
                  isSelected && "text-saffron"
                )}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
