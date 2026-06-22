"use client";

import { useEffect, useState, useMemo } from "react";
import { Star, Trash2, Search, ShieldAlert, LogOut, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AdminReview {
  id: number;
  rating: number;
  comment: string;
  procedure_name: string;
  language: string;
  user_id: string;
  case_id: string;
  created_at: string;
}

interface AdminData {
  reviews: AdminReview[];
  total_count: number;
  average_rating: number;
  distribution: Record<string, number>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          className={
            i <= rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-gray-300"
          }
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Auth gate ──────────────────────────────────────────────────────────────

function AdminLogin({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setChecking(true);
    setError(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/reviews`, {
        headers: { "X-Admin-Key": key },
      });
      if (res.ok) {
        sessionStorage.setItem("admin_key", key);
        onAuth(key);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm space-y-6 rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-8 shadow-modal">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-light">
            <ShieldAlert size={22} className="text-saffron-dark" />
          </div>
          <h1 className="font-display text-2xl text-navy">Admin Access</h1>
          <p className="text-sm text-text-muted">Enter your admin secret key to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin secret key"
            autoFocus
            className="w-full rounded-[var(--radius-sm)] border border-paper-dark bg-ivory px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-saffron focus:outline-none"
          />
          {error && (
            <p className="text-xs text-danger">Invalid key. Check your ADMIN_SECRET env var.</p>
          )}
          <button
            type="submit"
            disabled={!key.trim() || checking}
            className="w-full rounded-[var(--radius-sm)] bg-saffron py-2.5 text-sm font-semibold text-white transition-colors hover:bg-saffron-dark disabled:opacity-40"
          >
            {checking ? "Verifying…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

function AdminPanel({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/admin/reviews`, { headers: { "X-Admin-Key": adminKey } })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.reviews.filter((r) => {
      if (starFilter !== null && r.rating !== starFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.comment.toLowerCase().includes(q) ||
          r.procedure_name.toLowerCase().includes(q) ||
          r.user_id.toLowerCase().includes(q) ||
          r.case_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, starFilter, search]);

  const handleDelete = async (id: number) => {
    if (deleting.has(id)) return;
    setDeleting((p) => new Set(p).add(id));
    try {
      await fetch(`${API_URL}/api/admin/reviews/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      load();
    } catch {
      alert("Delete failed.");
    } finally {
      setDeleting((p) => { const s = new Set(p); s.delete(id); return s; });
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0 || bulkDeleting) return;
    if (!window.confirm(`Delete ${selected.size} review${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch(`${API_URL}/api/admin/reviews/${id}`, {
            method: "DELETE",
            headers: { "X-Admin-Key": adminKey },
          })
        )
      );
      setSelected(new Set());
      load();
    } catch {
      alert("Some deletes failed.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  const toggleSelectAll = () =>
    setSelected(
      allFilteredSelected ? new Set() : new Set(filtered.map((r) => r.id))
    );

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-paper-dark bg-surface/90 backdrop-blur-sm px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-saffron-dark" />
            <h1 className="font-display text-lg text-navy">Review Moderation</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-paper-dark px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-paper disabled:opacity-40"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-paper-dark px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-paper"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 space-y-6">

        {/* Stats Bar */}
        {data && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-[var(--radius-md)] border border-paper-dark bg-surface p-4 text-center shadow-sm">
              <p className="font-display text-3xl text-saffron">{data.total_count}</p>
              <p className="mt-0.5 text-xs text-text-muted">Total Reviews</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-paper-dark bg-surface p-4 text-center shadow-sm">
              <p className="font-display text-3xl text-navy">{data.average_rating.toFixed(1)}</p>
              <p className="mt-0.5 text-xs text-text-muted">Avg Rating</p>
            </div>
            {[5, 1].map((star) => (
              <div key={star} className="rounded-[var(--radius-md)] border border-paper-dark bg-surface p-4 text-center shadow-sm">
                <p className="font-display text-3xl text-navy">
                  {data.distribution[String(star)] ?? 0}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{star}★ Reviews</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {([null, 5, 4, 3, 2, 1] as (number | null)[]).map((star) => (
              <button
                key={star ?? "all"}
                onClick={() => setStarFilter(star)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  starFilter === star
                    ? "bg-saffron text-white"
                    : "border border-paper-dark bg-surface text-text-secondary hover:border-saffron/40"
                }`}
              >
                {star === null ? "All" : `${star}★`}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search comment, procedure, user…"
              className="w-full rounded-[var(--radius-sm)] border border-paper-dark bg-ivory py-1.5 pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-saffron focus:outline-none sm:w-64"
            />
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3">
            <p className="text-sm text-danger font-medium">
              {selected.size} review{selected.size > 1 ? "s" : ""} selected
            </p>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 size={13} />
              {bulkDeleting ? "Deleting…" : `Delete ${selected.size}`}
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse h-16 rounded-[var(--radius-md)] bg-paper-dark" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-text-muted">No reviews match your filter.</div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-paper-dark bg-surface shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-paper-dark bg-paper/60">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      className="accent-saffron"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide">Comment</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide sm:table-cell">Procedure</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide md:table-cell">User ID</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wide lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-dark">
                {filtered.map((review) => (
                  <tr
                    key={review.id}
                    className={`transition-colors hover:bg-paper/40 ${
                      selected.has(review.id) ? "bg-saffron-light/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(review.id)}
                        onChange={() => toggleSelect(review.id)}
                        className="accent-saffron"
                        aria-label={`Select review ${review.id}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StarRow rating={review.rating} />
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-text-primary">
                        {review.comment || <span className="text-text-muted italic">—</span>}
                      </p>
                      <p className="text-[10px] text-text-muted">{review.language.toUpperCase()} · #{review.id}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {review.procedure_name ? (
                        <span className="rounded-full bg-saffron-light px-2 py-0.5 text-xs text-saffron-dark">
                          {review.procedure_name}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="font-mono text-[11px] text-text-muted">
                        {review.user_id ? review.user_id.slice(0, 20) + "…" : "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs text-text-muted">{formatDate(review.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deleting.has(review.id)}
                        title="Delete review"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                        aria-label="Delete review"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-paper-dark bg-paper/40 px-4 py-2.5 text-xs text-text-muted">
              Showing {filtered.length} of {data?.total_count ?? 0} reviews
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_key");
    if (saved) setAdminKey(saved);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_key");
    setAdminKey(null);
  };

  if (!adminKey) {
    return <AdminLogin onAuth={setAdminKey} />;
  }

  return <AdminPanel adminKey={adminKey} onLogout={handleLogout} />;
}
