"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Scale,
  Clock,
  IndianRupee,
  Building2,
  ChevronRight,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { Badge, CardSkeleton } from "@/components/ui";
import { cn } from "@/lib/cn";

interface KGProcedure {
  procedure_id: string;
  name_en: string;
  name_ta?: string;
  issuing_authority: string;
  applicable_when: string;
  estimated_duration_days: { min: number; max: number };
  fee_inr: number;
  office_type: string;
  life_events?: string[];
  dependencies?: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LIFE_EVENT_FILTERS = [
  { key: "all", label: "All" },
  { key: "death", label: "Death" },
  { key: "marriage", label: "Marriage" },
  { key: "birth", label: "Birth" },
  { key: "property", label: "Property" },
  { key: "pension", label: "Pension" },
];

function matchesLifeEvent(proc: KGProcedure, filter: string): boolean {
  if (filter === "all") return true;
  const id = proc.procedure_id.toLowerCase();
  const when = proc.applicable_when.toLowerCase();
  const le = (proc.life_events ?? []).join(" ").toLowerCase();
  const combined = `${id} ${when} ${le}`;
  return combined.includes(filter);
}

/**
 * Procedure Knowledge Explorer — browse and search all 20+ procedures
 * in the KG without needing to start a case.
 */
export default function ProceduresPage() {
  const [procedures, setProcedures] = useState<KGProcedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lifeEventFilter, setLifeEventFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/procedures`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setProcedures(data.procedures ?? []);
      } catch {
        // Use static fallback from window so page works offline
        setProcedures([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return procedures.filter((p) => {
      const matchesSearch =
        !q ||
        p.name_en.toLowerCase().includes(q) ||
        (p.name_ta ?? "").includes(q) ||
        p.issuing_authority.toLowerCase().includes(q) ||
        p.procedure_id.includes(q) ||
        p.applicable_when.toLowerCase().includes(q);
      const matchesEvent = matchesLifeEvent(p, lifeEventFilter);
      return matchesSearch && matchesEvent;
    });
  }, [procedures, query, lifeEventFilter]);

  return (
    <main className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-paper-dark bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/"
              className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <Scale size={18} className="text-saffron" />
            <div>
              <h1 className="font-display text-lg text-navy leading-tight">
                Procedure Explorer
              </h1>
              <p className="text-xs text-text-muted">
                {loading ? "Loading…" : `${procedures.length} procedures in knowledge graph`}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search procedures in English or Tamil…"
              className={cn(
                "w-full rounded-[var(--radius-md)] border border-paper-dark bg-ivory py-2.5 pl-9 pr-4 text-sm",
                "placeholder:text-text-muted focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20"
              )}
            />
          </div>

          {/* Life event filters */}
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            <Filter size={13} className="shrink-0 self-center text-text-muted" />
            {LIFE_EVENT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setLifeEventFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all",
                  lifeEventFilter === f.key
                    ? "border-saffron bg-saffron text-white"
                    : "border-paper-dark bg-surface text-text-muted hover:border-saffron/40 hover:text-navy"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && (
          <>
            <p className="mb-4 text-sm text-text-muted">
              {filtered.length} of {procedures.length} procedures
              {query && <> matching &quot;{query}&quot;</>}
            </p>

            <AnimatePresence mode="popLayout">
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((proc, i) => (
                  <ProcedureCard key={proc.procedure_id} proc={proc} index={i} />
                ))}
              </div>
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="font-display text-xl text-navy">No procedures found</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Try a different search term or filter
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ProcedureCard({ proc, index }: { proc: KGProcedure; index: number }) {
  const name = proc.procedure_id
    .replace(/^tn_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const daysRange =
    proc.estimated_duration_days.min === proc.estimated_duration_days.max
      ? `${proc.estimated_duration_days.min} days`
      : `${proc.estimated_duration_days.min}–${proc.estimated_duration_days.max} days`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="group rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-4 shadow-sm hover:border-saffron/40 hover:shadow-card transition-all duration-[var(--duration-base)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-display text-base text-navy">{proc.name_en}</h3>
          {proc.name_ta && (
            <p className="font-tamil text-xs text-text-muted mt-0.5">{proc.name_ta}</p>
          )}
        </div>
        <ChevronRight
          size={16}
          className="shrink-0 text-text-muted mt-1 transition-transform group-hover:translate-x-1"
        />
      </div>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
        {proc.applicable_when}
      </p>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted border-t border-paper-dark pt-3">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {daysRange}
        </span>
        <span className="flex items-center gap-1">
          <IndianRupee size={11} />
          {proc.fee_inr === 0 ? "Free" : `₹${proc.fee_inr}`}
        </span>
        <span className="flex items-center gap-1 min-w-0">
          <Building2 size={11} className="shrink-0" />
          <span className="truncate">{proc.issuing_authority.split(" (")[0]}</span>
        </span>

        {(proc.dependencies ?? []).length > 0 && (
          <span className="ml-auto rounded-full bg-paper px-2 py-0.5 text-[10px]">
            Requires {proc.dependencies!.length} step{proc.dependencies!.length !== 1 ? "s" : ""} first
          </span>
        )}
      </div>
    </motion.div>
  );
}
