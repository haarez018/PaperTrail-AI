"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Summary {
  average_rating: number;
  total_count: number;
  five_star_percentage: number;
}

export function ReviewSummaryWidget() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews/summary`)
      .then((r) => r.json())
      .then(setSummary)
      .catch(() => {});
  }, []);

  if (!summary || summary.total_count === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-center gap-1.5">
        <Star size={18} className="fill-yellow-400 text-yellow-400" />
        <span className="font-display text-4xl text-white">
          {summary.average_rating.toFixed(1)}
        </span>
        <span className="text-2xl text-white/60">/ 5</span>
      </div>
      <div className="mt-1 text-sm text-white/60">
        Based on {summary.total_count} review{summary.total_count !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
