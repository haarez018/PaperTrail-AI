"use client";

import { useEffect, useState } from "react";

type Status = "ok" | "degraded" | "down" | "loading";

interface HealthData {
  status: string;
  llm_mode?: string;
  llm_status?: string;
}

function derive(data: HealthData | null, error: boolean): Status {
  if (error || !data) return "down";
  if (data.llm_status === "unavailable") return "degraded";
  return "ok";
}

const config: Record<Status, { dot: string; label: string; title: string }> = {
  ok:      { dot: "bg-green-500",  label: "All systems operational", title: "Backend + LLM online" },
  degraded:{ dot: "bg-yellow-400", label: "Deterministic mode",      title: "Ollama unavailable — AI uses fast keyword extraction" },
  down:    { dot: "bg-red-500",    label: "Backend offline",          title: "Cannot reach server" },
  loading: { dot: "bg-gray-400",   label: "Checking…",                title: "Checking server status" },
};

/** Status dot shown in the chat header. Polls /health every 30 s. */
export function SystemStatus() {
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(4000) });
        if (cancelled) return;
        if (!res.ok) { setStatus("down"); return; }
        const data: HealthData = await res.json();
        setStatus(derive(data, false));
        setDetail(data.llm_mode ?? "");
      } catch {
        if (!cancelled) setStatus("down");
      }
    }

    check();
    const id = setInterval(check, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const cfg = config[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-paper-dark bg-surface px-2.5 py-1 text-[11px] font-medium text-text-muted"
      title={`${cfg.title}${detail ? ` · mode: ${detail}` : ""}`}
    >
      <span className={`h-2 w-2 rounded-full ${cfg.dot} ${status === "ok" ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  );
}
