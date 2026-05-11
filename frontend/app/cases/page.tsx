"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Plus, RefreshCw, FolderOpen } from "lucide-react";
import { Button, CardSkeleton } from "@/components/ui";
import { CaseCard } from "@/components/CaseCard";

interface CaseSummary {
  case_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  procedure_count: number;
  done_count: number;
  progress_pct: number;
  total_estimated_days?: number;
  total_estimated_cost_inr?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** All-cases listing page — shows every saved case with progress summary. */
export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/cases`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setCases(data.cases ?? []);
    } catch (err) {
      setError("Could not load cases. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <main className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-paper-dark bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
          <Scale size={18} className="text-saffron" />
          <h1 className="font-display text-lg text-navy">My Cases</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={fetchCases}
              disabled={loading}
              className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors disabled:opacity-50"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <Link href="/chat">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                New Case
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-[var(--radius-lg)] border border-danger/20 bg-danger/5 p-6 text-center">
            <p className="text-sm text-text-secondary mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchCases}>
              <RefreshCw size={14} /> Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && cases.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <FolderOpen size={40} className="text-text-muted" />
            <div>
              <p className="font-display text-xl text-navy">No cases yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                Start by describing your situation — NyayaMitra will build your complete plan.
              </p>
            </div>
            <Link href="/chat">
              <Button variant="primary">Start a Case</Button>
            </Link>
          </div>
        )}

        {/* Cases list */}
        {!loading && !error && cases.length > 0 && (
          <>
            <p className="text-sm text-text-muted">
              {cases.length} case{cases.length !== 1 ? "s" : ""} saved on this device
            </p>
            <div className="space-y-3">
              {cases.map((c, i) => (
                <CaseCard
                  key={c.case_id}
                  caseId={c.case_id}
                  status={c.status}
                  createdAt={c.created_at}
                  procedureCount={c.procedure_count}
                  doneCount={c.done_count}
                  progressPct={c.progress_pct}
                  totalEstimatedDays={c.total_estimated_days}
                  totalEstimatedCostInr={c.total_estimated_cost_inr}
                  index={i}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
