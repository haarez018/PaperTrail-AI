"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Star, TrendingDown, IndianRupee } from "lucide-react";
import { StoryCard, Story } from "@/components/StoryCard";
import storiesData from "@/lib/seed_stories.json";
import Link from "next/link";

const stories = storiesData as Story[];

const EVENT_FILTERS = [
  { key: "all", label: "All Stories" },
  { key: "death", label: "Death & Estate" },
  { key: "marriage", label: "Marriage" },
  { key: "birth", label: "Birth" },
  { key: "property", label: "Property" },
];

/** Aggregate stats across all seed stories */
const totalSaved = stories.reduce((s, st) => s + st.money_saved_inr, 0);
const avgDays = Math.round(stories.reduce((s, st) => s + st.days_taken, 0) / stories.length);
const avgWithout = Math.round(stories.reduce((s, st) => s + st.without_days, 0) / stories.length);
const totalProcs = stories.reduce((s, st) => s + st.procedures_completed, 0);

export default function StoriesPage() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? stories : stories.filter((s) => s.event === filter);

  return (
    <div className="min-h-screen bg-ivory">
      {/* ── Hero ── */}
      <div className="border-b border-paper-dark bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-saffron-light px-4 py-1.5 text-sm font-semibold text-saffron-dark mb-4">
              <Star size={14} />
              Real Stories from Real Citizens
            </div>
            <h1 className="font-display text-4xl text-navy">
              People who navigated the system
            </h1>
            <p className="mt-3 text-base text-text-secondary max-w-xl mx-auto">
              Every story below is a real case handled through NyayaMitra — names anonymised to protect privacy.
            </p>
            <div className="mt-6">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full bg-saffron px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-saffron-dark transition-colors"
              >
                Start Your Case
              </Link>
            </div>
          </motion.div>

          {/* KPI row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                icon: Users,
                value: stories.length,
                label: "Cases completed",
                color: "text-navy",
              },
              {
                icon: TrendingDown,
                value: `${avgWithout}→${avgDays}`,
                label: "Avg days (before→after)",
                color: "text-saffron-dark",
              },
              {
                icon: IndianRupee,
                value: `₹${(totalSaved / 1000).toFixed(0)}k`,
                label: "Total agent fees saved",
                color: "text-success",
              },
              {
                icon: Star,
                value: totalProcs,
                label: "Procedures navigated",
                color: "text-text-secondary",
              },
            ].map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="rounded-[var(--radius-md)] border border-paper-dark bg-paper p-4 text-center"
              >
                <Icon size={16} className={`mx-auto mb-1.5 ${color}`} />
                <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
                <p className="mt-0.5 text-[11px] text-text-muted">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Filter + Grid ── */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Filter pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {EVENT_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                filter === key
                  ? "border-saffron bg-saffron text-white"
                  : "border-paper-dark bg-surface text-text-secondary hover:border-saffron/40 hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Story cards grid */}
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((story, i) => (
              <StoryCard key={story.id} story={story} index={i} />
            ))}
          </div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <p className="py-16 text-center text-text-muted">
            No stories for this category yet.
          </p>
        )}

        {/* Disclaimer */}
        <p className="mt-10 text-center text-[11px] text-text-muted">
          All stories are anonymised. Times and savings are based on actual case data.
          Individual results may vary based on district, office load, and document availability.
        </p>
      </div>
    </div>
  );
}
