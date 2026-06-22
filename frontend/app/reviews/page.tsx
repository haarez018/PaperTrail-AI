"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ArrowRight, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Review {
  id: number;
  rating: number;
  comment: string;
  procedure_name: string;
  language: string;
  created_at: string;
}

interface ReviewsData {
  reviews: Review[];
  average_rating: number;
  total_count: number;
  distribution: Record<string, number>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-transparent text-text-muted"
          }
        />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-5 space-y-3">
      <div className="h-4 w-24 rounded bg-paper-dark" />
      <div className="h-3 w-32 rounded bg-paper-dark" />
      <div className="h-3 w-full rounded bg-paper-dark" />
      <div className="h-3 w-3/4 rounded bg-paper-dark" />
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function ReviewsPage() {
  const userId = useAppStore((s) => s.userId);
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | null>(null);
  const [myIds, setMyIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("my_review_ids") ?? "[]") as number[];
    setMyIds(new Set(stored));
  }, []);

  const loadReviews = () => {
    fetch(`${API_URL}/api/reviews`)
      .then((r) => r.json())
      .then(setData)
      .catch(() =>
        setData({
          reviews: [],
          average_rating: 0,
          total_count: 0,
          distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
        })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReviews(); }, []);

  const handleDelete = async (id: number) => {
    if (!userId || deleting.has(id)) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;

    setDeleting((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(
        `${API_URL}/api/reviews/${id}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");

      // Remove from local tracking
      const updated = JSON.parse(localStorage.getItem("my_review_ids") ?? "[]").filter(
        (i: number) => i !== id
      );
      localStorage.setItem("my_review_ids", JSON.stringify(updated));
      setMyIds((prev) => { const s = new Set(prev); s.delete(id); return s; });

      // Refresh data
      setLoading(true);
      loadReviews();
    } catch {
      alert("Could not delete review. Please try again.");
    } finally {
      setDeleting((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const filtered = data
    ? filter === null
      ? data.reviews
      : data.reviews.filter((r) => r.rating === filter)
    : [];

  const avgRounded = Math.round(data?.average_rating ?? 0);

  return (
    <main className="min-h-screen bg-ivory px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Section 1 — Summary Header */}
        <div className="rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-8 text-center shadow-card">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 w-24 rounded bg-paper-dark mx-auto" />
              <div className="h-8 w-40 rounded bg-paper-dark mx-auto" />
              <div className="h-4 w-28 rounded bg-paper-dark mx-auto" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-5">
                <span className="font-display text-6xl text-saffron">
                  {data?.average_rating.toFixed(1) ?? "0.0"}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={28}
                        className={
                          i <= avgRounded
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-transparent text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-sm text-text-muted">
                    {data?.total_count ?? 0}{" "}
                    {(data?.total_count ?? 0) === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>

              {data && data.total_count > 0 && (
                <div className="mt-8 mx-auto max-w-xs space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = data.distribution[String(star)] ?? 0;
                    const pct = data.total_count > 0 ? (count / data.total_count) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="w-4 shrink-0 text-right text-xs text-text-muted">{star}</span>
                        <Star size={11} className="fill-yellow-400 text-yellow-400 shrink-0" />
                        <div className="flex-1 h-2.5 rounded-full bg-paper-dark overflow-hidden">
                          <div
                            className="h-2.5 rounded-full bg-saffron transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-5 shrink-0 text-left text-xs text-text-muted">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Section 2 — Filter Bar */}
        {!loading && data && data.total_count > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {([null, 5, 4, 3, 2, 1] as (number | null)[]).map((star) => {
              const count =
                star === null ? data.total_count : (data.distribution[String(star)] ?? 0);
              const active = filter === star;
              return (
                <button
                  key={star ?? "all"}
                  onClick={() => setFilter(star)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-saffron text-white"
                      : "border border-paper-dark bg-surface text-text-secondary hover:border-saffron/40 hover:text-navy"
                  }`}
                >
                  {star === null ? `All [${count}]` : `${star}★ [${count}]`}
                </button>
              );
            })}
          </div>
        )}

        {/* Section 3 — Reviews Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron-light">
              <Star size={28} className="text-saffron-dark" />
            </div>
            <p className="text-lg font-semibold text-navy">No reviews yet.</p>
            <p className="text-sm text-text-muted">Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((review) => {
              const isMine = myIds.has(review.id);
              return (
                <div
                  key={review.id}
                  className="rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <StarRow rating={review.rating} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">
                        {formatDate(review.created_at)}
                      </span>
                      {isMine && (
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deleting.has(review.id)}
                          title="Delete your review"
                          className="rounded p-1 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                          aria-label="Delete review"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {isMine && (
                    <span className="inline-block rounded-full border border-saffron/30 bg-saffron-light px-2 py-0.5 text-[10px] font-medium text-saffron-dark">
                      Your review
                    </span>
                  )}
                  {review.procedure_name && (
                    <span className="inline-block rounded-full bg-saffron-light px-2.5 py-0.5 text-xs font-medium text-saffron-dark">
                      {review.procedure_name}
                    </span>
                  )}
                  {review.comment && (
                    <p className="text-sm leading-relaxed text-text-secondary">{review.comment}</p>
                  )}
                  <p className="text-xs text-text-muted">{review.language.toUpperCase()}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Section 4 — CTA */}
        <div className="text-center pt-4 pb-4">
          <Link
            href="/chat"
            className="group inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-saffron px-8 py-4 text-lg font-semibold text-white shadow-card transition-all hover:bg-saffron-dark hover:shadow-card-hover active:scale-[0.98]"
          >
            Try PaperTrail AI
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Admin link — subtle */}
        <div className="text-center pb-4">
          <Link
            href="/admin/reviews"
            className="text-xs text-text-muted hover:text-saffron transition-colors"
          >
            Admin
          </Link>
        </div>

      </div>
    </main>
  );
}
