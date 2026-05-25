"use client";

import { motion } from "framer-motion";
import {
  X,
  Check,
  CalendarDays,
  IndianRupee,
  ClipboardList,
  FileText,
  MapPin,
  AlertTriangle,
  HelpCircle,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { ProcedurePlan } from "@/lib/api";

interface ComparisonViewProps {
  plan: ProcedurePlan;
}

const withoutItems = [
  { icon: X, text: "6–12 months of running between offices" },
  { icon: X, text: "₹15,000–₹50,000 in tout and agent fees" },
  { icon: X, text: "3–5 missed procedures discovered months later" },
  { icon: X, text: "No idea which office, which counter, which documents" },
  { icon: X, text: "Applications rejected with no explanation given" },
  { icon: X, text: "No legal recourse if an office ignores you" },
];

interface WithItem {
  icon: React.ElementType;
  text: string;
  highlight?: boolean;
}

/**
 * Side-by-side "With vs Without PaperTrail AI" comparison panel.
 * Animates in from opposite sides to meet in the centre.
 */
export function ComparisonView({ plan }: ComparisonViewProps) {
  const withItems: WithItem[] = [
    {
      icon: Scale,
      text: `Complete plan in 90 seconds`,
      highlight: true,
    },
    {
      icon: IndianRupee,
      text: `₹0 cost — free, works offline`,
      highlight: true,
    },
    {
      icon: ClipboardList,
      text: `All ${plan.procedures.length} procedures identified automatically`,
    },
    {
      icon: FileText,
      text: "Auto-filled forms ready to print and submit",
    },
    {
      icon: MapPin,
      text: "Exact office, counter, timing, and what to say",
    },
    {
      icon: AlertTriangle,
      text: "Pre-drafted RTI letter if anything stalls",
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-navy">The Difference</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Same procedures. One path takes months and ₹50,000. The other takes 3 weeks and ₹0.
        </p>
      </div>

      {/* Comparison grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Without PaperTrail AI */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50/40 p-4"
        >
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle size={18} className="text-danger" />
            <h3 className="font-display text-base text-danger">Without PaperTrail AI</h3>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-sm)] bg-red-100/60 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 font-display text-2xl text-danger line-through opacity-60">
                <CalendarDays size={16} />
                {plan.without_papertrail_baseline_days}
              </div>
              <p className="text-[10px] text-text-muted">days</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-red-100/60 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 font-display text-2xl text-danger line-through opacity-60">
                <IndianRupee size={16} />
                {plan.without_papertrail_baseline_cost_inr.toLocaleString()}
              </div>
              <p className="text-[10px] text-text-muted">in fees</p>
            </div>
          </div>

          <ul className="space-y-2">
            {withoutItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="flex items-start gap-2 text-sm text-danger/80"
                >
                  <Icon size={14} className="mt-0.5 shrink-0 text-danger" />
                  <span>{item.text}</span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        {/* With PaperTrail AI */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "rounded-[var(--radius-lg)] border border-saffron/30 p-4",
            "bg-saffron-light/40 ring-2 ring-saffron/20"
          )}
        >
          <div className="mb-4 flex items-center gap-2">
            <Scale size={18} className="text-saffron-dark" />
            <h3 className="font-display text-base text-saffron-dark">With PaperTrail AI</h3>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-sm)] bg-saffron-light/80 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 font-display text-2xl text-navy">
                <CalendarDays size={16} />
                ~{plan.total_estimated_days}
              </div>
              <p className="text-[10px] text-saffron-dark">days</p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-saffron-light/80 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 font-display text-2xl text-navy">
                <IndianRupee size={16} />
                {plan.total_estimated_cost_inr.toLocaleString()}
              </div>
              <p className="text-[10px] text-saffron-dark">in fees</p>
            </div>
          </div>

          <ul className="space-y-2">
            {withItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    item.highlight ? "font-semibold text-navy" : "text-text-secondary"
                  )}
                >
                  <Check size={14} className="mt-0.5 shrink-0 text-success" />
                  <span>{item.text}</span>
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      </div>

      {/* Savings banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 rounded-[var(--radius-md)] bg-navy px-4 py-3 text-center text-sm text-white"
      >
        <span className="font-semibold text-saffron">
          Estimated savings: ₹{(plan.without_papertrail_baseline_cost_inr - plan.total_estimated_cost_inr).toLocaleString()}
        </span>
        {" "}and{" "}
        <span className="font-semibold text-saffron">
          {plan.without_papertrail_baseline_days - plan.total_estimated_days} days
        </span>
        {" "}with PaperTrail AI
        <p className="mt-1 text-[11px] text-white/60">
          PaperTrail AI is free · You only pay government fees
        </p>
      </motion.div>
    </div>
  );
}
