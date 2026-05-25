"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Scale, CalendarDays, IndianRupee, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, Badge, ProgressBar } from "@/components/ui";

interface CaseCardProps {
  caseId: string;
  status: string;
  createdAt: string;
  procedureCount: number;
  doneCount: number;
  progressPct: number;
  totalEstimatedDays?: number;
  totalEstimatedCostInr?: number;
  index?: number;
}

export function CaseCard({
  caseId,
  status,
  createdAt,
  procedureCount,
  doneCount,
  progressPct,
  totalEstimatedDays,
  totalEstimatedCostInr,
  index = 0,
}: CaseCardProps) {
  const shortId = caseId.slice(0, 8).toUpperCase();
  const date = new Date(createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link href={`/case/${caseId}`}>
        <Card hoverable className="group">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-saffron" />
                  <span className="font-mono text-sm font-bold text-navy">
                    PT-{shortId}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-muted flex items-center gap-1">
                  <Clock size={10} />
                  {date}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={status as any}>
                  {status}
                </Badge>
                <ArrowRight
                  size={14}
                  className="text-text-muted transition-transform group-hover:translate-x-1"
                />
              </div>
            </div>

            {/* Progress */}
            <ProgressBar value={progressPct} label={`${doneCount}/${procedureCount} procedures done`} />

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-text-muted">
              {totalEstimatedDays !== undefined && (
                <span className="flex items-center gap-1">
                  <CalendarDays size={11} />
                  ~{totalEstimatedDays} days
                </span>
              )}
              {totalEstimatedCostInr != null && (
                <span className="flex items-center gap-1">
                  <IndianRupee size={11} />
                  {totalEstimatedCostInr.toLocaleString()} in fees
                </span>
              )}
              <span className="ml-auto font-medium">
                {procedureCount} procedures
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
