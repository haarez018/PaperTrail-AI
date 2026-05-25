"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  Check,
  Scale,
  CalendarDays,
  IndianRupee,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { shareText, canShare } from "@/lib/shareUtils";
import type { ProcedurePlan } from "@/lib/api";

interface ShareCardProps {
  plan: ProcedurePlan;
  caseId: string | null;
  className?: string;
}

type ShareState = "idle" | "loading" | "shared" | "copied" | "preview";

/**
 * Generates and shares a WhatsApp-style case summary card.
 * On mobile: opens native share sheet (WhatsApp/Telegram/etc).
 * On desktop: copies formatted text to clipboard.
 */
export function ShareCard({ plan, caseId, className }: ShareCardProps) {
  const [state, setState] = useState<ShareState>("idle");

  const done = plan.procedures.filter((p) => p.status === "done").length;
  const inProgress = plan.procedures.filter((p) => p.status === "in_progress").length;
  const blocked = plan.procedures.filter((p) => p.status === "blocked").length;
  const pending = plan.procedures.length - done - inProgress - blocked;

  const savings = {
    days: plan.without_papertrail_baseline_days - plan.total_estimated_days,
    money: plan.without_papertrail_baseline_cost_inr - plan.total_estimated_cost_inr,
  };

  // Next pending procedure
  const nextProc = plan.procedures.find(
    (p) => p.status === "pending" || p.status === "in_progress"
  );
  const nextName = nextProc
    ? nextProc.procedure_id
        .replace(/^tn_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  const buildShareText = () => {
    const lines = [
      "📋 *PaperTrail AI Case Plan*",
      "━━━━━━━━━━━━━━━━━━━━━",
      "",
      `📊 *${plan.procedures.length} procedures identified*`,
      done > 0 ? `✅ ${done} completed` : null,
      inProgress > 0 ? `⏳ ${inProgress} in progress` : null,
      pending > 0 ? `📌 ${pending} pending` : null,
      blocked > 0 ? `🔴 ${blocked} blocked` : null,
      "",
      `📅 Est. duration: ~${plan.total_estimated_days} days`,
      `💰 Fees: ₹${plan.total_estimated_cost_inr.toLocaleString()}`,
      savings.days > 0
        ? `✨ Saving ${savings.days} days & ₹${savings.money.toLocaleString()} vs doing it alone`
        : null,
      "",
      nextName ? `⏩ *Next step:* ${nextName}` : null,
      "",
      "PaperTrail AI — Free AI for Indian bureaucracy",
      "papertrailai.app",
    ].filter((l) => l !== null);

    return lines.join("\n");
  };

  const handleShare = async () => {
    setState("loading");
    const text = buildShareText();
    const result = await shareText(
      "My PaperTrail AI Case Plan",
      text,
      "https://papertrailai.app"
    );
    if (result === "shared" || result === "copied") {
      setState(result);
      setTimeout(() => setState("idle"), 3000);
    } else {
      setState("idle");
    }
  };

  const buttonLabel = {
    idle: canShare() ? "Share Plan" : "Copy Plan",
    loading: "Preparing…",
    shared: "Shared!",
    copied: "Copied!",
    preview: "Share Plan",
  };

  const ButtonIcon = {
    idle: Share2,
    loading: Share2,
    shared: Check,
    copied: Check,
    preview: Share2,
  };

  const IconComp = ButtonIcon[state];

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        {/* Preview toggle */}
        <button
          onClick={() => setState(state === "preview" ? "idle" : "preview")}
          className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors"
          title="Preview share card"
        >
          {state === "preview" ? <X size={14} /> : <ClipboardList size={14} />}
        </button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={state === "loading"}
          className={cn(
            "gap-1.5",
            (state === "shared" || state === "copied") &&
              "border-success text-success"
          )}
        >
          <IconComp size={14} />
          {buttonLabel[state]}
        </Button>
      </div>

      {/* Preview card */}
      <AnimatePresence>
        {state === "preview" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={cn(
              "absolute right-0 top-10 z-50 w-64 rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-4 shadow-card-hover",
              "font-mono text-xs"
            )}
          >
            {/* Card header */}
            <div className="mb-3 flex items-center gap-2 border-b border-paper-dark pb-2">
              <Scale size={14} className="text-saffron" />
              <span className="font-display text-sm text-navy font-bold">PaperTrail AI</span>
            </div>

            <div className="space-y-1.5 text-text-secondary">
              <div className="flex items-center gap-1.5">
                <ClipboardList size={11} className="text-saffron" />
                <span>{plan.procedures.length} procedures identified</span>
              </div>
              {done > 0 && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-success" />
                  <span>{done} completed</span>
                </div>
              )}
              {inProgress > 0 && (
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-warning-dark" />
                  <span>{inProgress} in progress</span>
                </div>
              )}
              {blocked > 0 && (
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={11} className="text-danger" />
                  <span>{blocked} blocked</span>
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1 border-t border-paper-dark pt-2 text-text-muted">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={11} />
                <span>~{plan.total_estimated_days} days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IndianRupee size={11} />
                <span>₹{plan.total_estimated_cost_inr.toLocaleString()} in fees</span>
              </div>
              {savings.days > 0 && (
                <p className="text-saffron font-semibold text-[10px] mt-1">
                  Saving {savings.days}d & ₹{savings.money.toLocaleString()}
                </p>
              )}
            </div>

            <div className="mt-3 border-t border-paper-dark pt-2 text-[10px] text-text-muted text-center">
              papertrailai.app
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
