"use client";

import { motion } from "framer-motion";
import { ProcedurePlan, Procedure } from "@/lib/api";

interface ProcedureTimelineProps {
  plan: ProcedurePlan;
  selectedProcedure: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-300",
  in_progress: "bg-yellow-400",
  done: "bg-green-500",
  blocked: "bg-red-400",
  escalated: "bg-orange-500",
};

const statusIcons: Record<string, string> = {
  pending: "O",
  in_progress: "...",
  done: "OK",
  blocked: "X",
  escalated: "!",
};

export default function ProcedureTimeline({
  plan,
  selectedProcedure,
  onSelect,
}: ProcedureTimelineProps) {
  return (
    <div className="p-6">
      {/* Header stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Procedure Plan</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-nyaya-50 rounded-xl p-4 border border-nyaya-100">
            <div className="text-sm text-nyaya-600 font-medium">With NyayaMitra</div>
            <div className="text-3xl font-bold text-nyaya-700 mt-1">
              ~{plan.total_estimated_days} days
            </div>
            <div className="text-sm text-nyaya-500 mt-1">
              Rs.{plan.total_estimated_cost_inr} in fees
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-500 font-medium">Without help</div>
            <div className="text-3xl font-bold text-gray-400 mt-1 line-through">
              ~{plan.without_nyayamitra_baseline_days} days
            </div>
            <div className="text-sm text-gray-400 mt-1 line-through">
              Rs.{plan.without_nyayamitra_baseline_cost_inr} in agent fees
            </div>
          </div>
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

        {plan.procedures.map((proc, index) => (
          <motion.div
            key={proc.procedure_id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.12 }}
            className={`relative flex items-start mb-6 cursor-pointer group ${
              selectedProcedure === proc.procedure_id ? "scale-[1.02]" : ""
            }`}
            onClick={() => onSelect(proc.procedure_id)}
          >
            {/* Node dot */}
            <div
              className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-md text-xs font-bold text-white ${
                statusColors[proc.status] || "bg-gray-300"
              }`}
            >
              {proc.order}
            </div>

            {/* Content card */}
            <div
              className={`ml-4 flex-1 rounded-xl p-4 transition-all duration-200 ${
                selectedProcedure === proc.procedure_id
                  ? "bg-nyaya-50 border-2 border-nyaya-300 shadow-md"
                  : "bg-white border border-gray-200 group-hover:border-nyaya-200 group-hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {proc.procedure_id
                      .replace(/^tn_/, "")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {proc.why_this_is_needed}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                      proc.status === "pending"
                        ? "bg-gray-100 text-gray-600"
                        : proc.status === "done"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {proc.status}
                  </span>
                </div>
              </div>

              {/* Dependency badges */}
              {proc.depends_on_procedure_ids.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {proc.depends_on_procedure_ids.map((dep) => (
                    <span
                      key={dep}
                      className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500"
                    >
                      needs: {dep.replace(/^tn_/, "").replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}

              {/* Timeline bar */}
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400">
                <span>Day {proc.estimated_start_after_days}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: index * 0.12 + 0.3 }}
                    className="h-full bg-nyaya-300 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
