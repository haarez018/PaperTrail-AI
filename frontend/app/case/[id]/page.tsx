"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  Clock,
  IndianRupee,
  CalendarDays,
  FileText,
  RefreshCw,
  Download,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  Badge,
  ProgressBar,
  Button,
  LoadingSpinner,
  CardSkeleton,
} from "@/components/ui";
import { getCase, CaseData, Procedure, ProcedureStatus } from "@/lib/api";
import { ExportKitButton } from "@/components/ExportKitButton";
import { DeadlineTracker } from "@/components/DeadlineTracker";
import { ShareCaseButton } from "@/components/ShareCaseButton";
import { OfflineKitButton } from "@/components/OfflineKitButton";

/** Dashboard view for a specific case — shows stats, progress, and procedure list. */
export default function CasePage({ params }: { params: { id: string } }) {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kitLoading, setKitLoading] = useState(false);

  const fetchCase = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCase(params.id);
      setCaseData(data);
    } catch {
      setError("Hmm, I can't reach the server right now. Your case data might still be loading — let me try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadKit = async () => {
    setKitLoading(true);
    try {
      const res = await fetch(`/api/cases/${params.id}/export`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PaperTrail-${params.id}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setKitLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [params.id]);

  return (
    <main className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-paper-dark bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/chat"
            className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors"
            aria-label="Back to chat"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-saffron" />
            <h1 className="font-display text-lg text-navy">Case Dashboard</h1>
          </div>
          <span className="ml-auto font-mono text-sm text-text-muted">{params.id}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton className="sm:col-span-2" />
          </div>
        )}

        {error && (
          <Card className="border-danger/20">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-text-secondary">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCase}>
                <RefreshCw size={14} /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && caseData && (
          <>
            {/* Stats Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-light">
                    <CalendarDays size={18} className="text-saffron-dark" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Estimated Days
                    </p>
                    <p className="font-display text-xl text-navy">
                      {caseData.plan?.total_estimated_days ?? "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-light">
                    <IndianRupee size={18} className="text-saffron-dark" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Total Fees
                    </p>
                    <p className="font-display text-xl text-navy">
                      Rs. {caseData.plan?.total_estimated_cost_inr ?? "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-light">
                    <FileText size={18} className="text-saffron-dark" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                      Procedures
                    </p>
                    <p className="font-display text-xl text-navy">
                      {caseData.plan?.procedures?.length ?? "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress */}
            {caseData.plan?.procedures && (
              <Card>
                <CardContent>
                  <ProgressBar
                    value={Math.round(
                      (caseData.plan.procedures.filter((p: Procedure) => p.status === "done").length /
                        caseData.plan.procedures.length) *
                        100
                    )}
                    label="Overall Progress"
                  />
                </CardContent>
              </Card>
            )}

            {/* Deadline Tracker */}
            {caseData.plan?.procedures && (
              <DeadlineTracker procedures={caseData.plan.procedures} />
            )}

            {/* Share */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-text-muted">Share your progress</p>
              <ShareCaseButton
                caseId={params.id}
                procedureCount={caseData.plan?.procedures?.length ?? 0}
                estimatedDays={caseData.plan?.total_estimated_days ?? 0}
              />
            </div>

            {/* Procedure List */}
            {caseData.plan?.procedures && (
              <Card>
                <CardHeader>
                  <h2 className="font-display text-lg text-navy">Procedures</h2>
                </CardHeader>
                <CardContent className="divide-y divide-paper-dark">
                  {caseData.plan.procedures.map((proc: Procedure) => (
                    <div
                      key={proc.procedure_id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy">
                          {proc.procedure_id
                            .replace(/^tn_/, "")
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-text-muted line-clamp-1">
                          {proc.why_this_is_needed}
                        </p>
                      </div>
                      <Badge status={proc.status as ProcedureStatus} className="shrink-0">
                        {proc.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/chat">
                <Button variant="primary">
                  <Scale size={16} /> Continue in Chat
                </Button>
              </Link>
              <ExportKitButton caseId={params.id} />
              {caseData.plan && (
                <OfflineKitButton plan={caseData.plan} caseId={params.id} />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadKit}
                disabled={kitLoading}
                aria-label="Download case data as zip archive"
                className="inline-flex items-center gap-1.5"
              >
                {kitLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {kitLoading ? "Preparing…" : "Download Kit (.zip)"}
              </Button>
            </div>
          </>
        )}

        {!loading && !error && !caseData && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock size={32} className="mx-auto text-text-muted" />
              <p className="mt-3 text-text-secondary">
                No case data found for <span className="font-mono">{params.id}</span>
              </p>
              <Link href="/chat" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Start a New Case</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
