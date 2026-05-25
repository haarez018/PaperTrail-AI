"use client";
import { useAppStore } from "@/lib/store";
import { Clock, AlertTriangle } from "lucide-react";

export function DeadlineCountdown() {
  const deadlines = useAppStore((s) => s.deadlines);
  const entries = Object.entries(deadlines);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 sm:px-6">
      {entries.map(([procId, { submittedAt, deadlineDays }]) => {
        const deadline = submittedAt + deadlineDays * 86400000;
        const daysLeft = Math.ceil((deadline - Date.now()) / 86400000);
        const name = procId.replace(/^tn_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        const overdue = daysLeft < 0;
        const urgent = daysLeft >= 0 && daysLeft <= 3;
        const warning = daysLeft > 3 && daysLeft <= 7;

        return (
          <div
            key={procId}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              overdue ? "bg-red-100 text-red-700 animate-pulse" :
              urgent  ? "bg-orange-100 text-orange-700" :
              warning ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
            }`}
          >
            {overdue ? <AlertTriangle size={11} /> : <Clock size={11} />}
            {overdue
              ? `${name}: OVERDUE — File RTI`
              : `${name}: ${daysLeft}d left`}
          </div>
        );
      })}
    </div>
  );
}
