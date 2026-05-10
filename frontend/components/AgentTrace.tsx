"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Brain,
  ClipboardList,
  FileText,
  MapPin,
  AlertTriangle,
  Globe,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { TraceStep } from "@/lib/store";

interface AgentTraceProps {
  traces: TraceStep[];
  totalDurationMs?: number;
}

const agentConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  intake: {
    label: "Intake Agent",
    icon: Brain,
    color: "text-purple-500",
  },
  planner: {
    label: "Procedure Agent",
    icon: ClipboardList,
    color: "text-saffron",
  },
  document: {
    label: "Document Agent",
    icon: FileText,
    color: "text-info",
  },
  navigation: {
    label: "Navigator Agent",
    icon: MapPin,
    color: "text-success",
  },
  escalation: {
    label: "Escalation Agent",
    icon: AlertTriangle,
    color: "text-danger",
  },
  i18n: {
    label: "Language Agent",
    icon: Globe,
    color: "text-navy",
  },
  done: {
    label: "NyayaMitra",
    icon: Zap,
    color: "text-saffron",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Collapsible "How I figured this out" panel showing the
 * step-by-step agent reasoning trace for the current session.
 */
export function AgentTrace({ traces, totalDurationMs }: AgentTraceProps) {
  const [open, setOpen] = useState(false);

  if (traces.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl mt-2">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-[var(--radius-md)] border px-4 py-2.5",
          "border-paper-dark bg-paper/60 text-xs font-medium text-text-muted",
          "hover:border-saffron/30 hover:text-text-secondary transition-all duration-[var(--duration-fast)]"
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Brain size={13} className="text-saffron" />
          How I figured this out
          <span className="ml-1 rounded-full bg-saffron-light px-1.5 py-0.5 text-[10px] font-semibold text-saffron-dark">
            {traces.length} steps
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          {totalDurationMs !== undefined && (
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
              <Clock size={10} />
              {formatDuration(totalDurationMs)}
            </span>
          )}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {/* Trace panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-1 rounded-[var(--radius-md)] border border-paper-dark bg-surface p-4 font-mono text-xs">
              <ol className="space-y-4">
                {traces.map((step, idx) => {
                  const cfg = agentConfig[step.agent] ?? agentConfig.done;
                  const Icon = cfg.icon;

                  return (
                    <motion.li
                      key={step.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex gap-3"
                    >
                      {/* Step number + connector */}
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-[10px] font-bold text-text-muted">
                          {idx + 1}
                        </span>
                        {idx < traces.length - 1 && (
                          <span className="mt-1 flex-1 w-px bg-paper-dark" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-1">
                        {/* Agent label */}
                        <div className={cn("flex items-center gap-1.5 font-semibold", cfg.color)}>
                          <Icon size={13} />
                          {cfg.label}
                          {step.durationMs !== undefined && (
                            <span className="ml-auto text-[10px] text-text-muted font-normal">
                              {formatDuration(step.durationMs)}
                            </span>
                          )}
                        </div>

                        {/* Action summary */}
                        <p className="mt-0.5 text-text-secondary font-sans text-[11px] font-medium">
                          {step.action}
                        </p>

                        {/* Detail bullets */}
                        {step.details.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {step.details.map((d, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-1.5 text-[11px] text-text-muted"
                              >
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-text-muted/50" />
                                <span>{d}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
