"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Scale, RefreshCw, TrendingUp, Globe, ClipboardList, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardSkeleton } from "@/components/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface StatsData {
  total_cases: number;
  completed_cases: number;
  active_cases: number;
  avg_procedures_per_case: number;
  total_procedures_generated: number;
  language_distribution: { language: string; cases: number }[];
  top_procedures: { procedure_id: string; count: number }[];
  uptime_since: string | null;
}

/** Bar chart rendered in pure SVG — no external chart library needed. */
function BarChart({
  data,
  maxValue,
  color = "#E8751A",
  height = 120,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return null;
  const barW = Math.floor((360 - (data.length - 1) * 6) / data.length);

  return (
    <svg viewBox={`0 0 360 ${height + 28}`} className="w-full" aria-hidden="true">
      {data.map((d, i) => {
        const barH = maxValue > 0 ? Math.round((d.value / maxValue) * height) : 0;
        const x = i * (barW + 6);
        const y = height - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={3}
              fill={color}
              opacity={d.value > 0 ? 1 : 0.2}
            />
            <text
              x={x + barW / 2}
              y={height + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#8A9BB0"
            >
              {d.label.length > 10 ? d.label.slice(0, 10) + "…" : d.label}
            </text>
            {d.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="bold"
                fill="#1B2A4A"
              >
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-saffron",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-saffron-light">
          <Icon size={18} className={color} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {label}
          </p>
          <p className="font-display text-2xl text-navy">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Hidden stats page at /stats — for README screenshots and portfolio. */
export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/stats`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setStats(await res.json());
    } catch {
      setError("Could not load stats. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const langData = (stats?.language_distribution ?? []).map((l) => ({
    label: l.language,
    value: l.cases,
  }));

  const procData = (stats?.top_procedures ?? []).map((p) => ({
    label: p.procedure_id.replace(/^tn_/, "").replace(/_/g, " "),
    value: p.count,
  }));

  const maxLang = Math.max(...langData.map((d) => d.value), 1);
  const maxProc = Math.max(...procData.map((d) => d.value), 1);

  return (
    <main className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-paper-dark bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <Scale size={18} className="text-saffron" />
          <div>
            <h1 className="font-display text-lg text-navy">NyayaMitra · Performance Dashboard</h1>
            <p className="text-xs text-text-muted">
              Live metrics from local SQLite database
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="ml-auto rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {error && (
          <div className="rounded-[var(--radius-lg)] border border-danger/20 bg-danger/5 p-8 text-center">
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Scale} label="Total Cases" value={stats.total_cases} />
              <StatCard
                icon={CheckCircle}
                label="Completed"
                value={stats.completed_cases}
                color="text-success"
              />
              <StatCard
                icon={ClipboardList}
                label="Avg Procedures"
                value={stats.avg_procedures_per_case}
                color="text-navy"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Procedures"
                value={stats.total_procedures_generated}
                color="text-info"
              />
            </div>

            {/* Charts row */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-saffron" />
                    <h3 className="font-display text-base text-navy">
                      Language Distribution
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {langData.every((d) => d.value === 0) ? (
                    <p className="text-sm text-text-muted text-center py-8">
                      No cases yet
                    </p>
                  ) : (
                    <BarChart data={langData} maxValue={maxLang} color="#E8751A" />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-saffron" />
                    <h3 className="font-display text-base text-navy">
                      Most Accessed Procedures
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  {procData.length === 0 ? (
                    <p className="text-sm text-text-muted text-center py-8">
                      No procedures yet
                    </p>
                  ) : (
                    <BarChart data={procData} maxValue={maxProc} color="#1B2A4A" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* System info */}
            {stats.uptime_since && (
              <p className="text-center text-xs text-text-muted">
                First case recorded:{" "}
                {new Date(stats.uptime_since).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
