"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  calcDeadlineStatus,
  STATUTORY_DAYS,
  requestPermission,
  isNotificationsSupported,
  sendNotification,
  type DeadlineStatus,
} from "@/lib/notifications";
import type { Procedure } from "@/lib/api";

interface DeadlineTrackerProps {
  procedures: Procedure[];
}

/**
 * Tracks statutory deadlines for submitted procedures.
 * Shows urgency bands (ok/warning/overdue) and triggers browser notifications.
 */
export function DeadlineTracker({ procedures }: DeadlineTrackerProps) {
  const [expanded, setExpanded] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [submittedDates, setSubmittedDates] = useState<Record<string, string>>({});

  // Load saved submitted dates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nyayamitra-submitted-dates");
    if (saved) {
      try {
        setSubmittedDates(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    // Check notification permission
    setNotifEnabled(
      isNotificationsSupported() && Notification.permission === "granted"
    );
  }, []);

  // Only show procedures that have been submitted (have a date) or are "in_progress"
  const trackable = procedures.filter(
    (p) =>
      p.status === "in_progress" ||
      p.status === "done" ||
      submittedDates[p.procedure_id]
  );

  const deadlines: DeadlineStatus[] = trackable
    .filter((p) => submittedDates[p.procedure_id])
    .map((p) => {
      const statutory =
        STATUTORY_DAYS[p.procedure_id] ?? STATUTORY_DAYS.default;
      const name = p.procedure_id
        .replace(/^tn_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      return calcDeadlineStatus(
        p.procedure_id,
        name,
        submittedDates[p.procedure_id],
        statutory
      );
    });

  const overdue = deadlines.filter((d) => d.urgency === "overdue");
  const warning = deadlines.filter((d) => d.urgency === "warning");
  const ok = deadlines.filter((d) => d.urgency === "ok");

  const handleMarkSubmitted = (procedureId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const updated = { ...submittedDates, [procedureId]: today };
    setSubmittedDates(updated);
    localStorage.setItem("nyayamitra-submitted-dates", JSON.stringify(updated));

    // Fire a confirmation notification
    if (notifEnabled) {
      const name = procedureId
        .replace(/^tn_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const days = STATUTORY_DAYS[procedureId] ?? 30;
      sendNotification("NyayaMitra — Deadline set", {
        body: `${name}: expected by ${new Date(Date.now() + days * 86400000).toLocaleDateString("en-IN")}`,
        tag: `submitted-${procedureId}`,
      });
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestPermission();
    setNotifEnabled(perm === "granted");
  };

  if (trackable.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-saffron" />
            <h3 className="font-display text-base text-navy">Deadline Tracker</h3>
            {overdue.length > 0 && (
              <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                {overdue.length} overdue
              </span>
            )}
            {warning.length > 0 && (
              <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-navy">
                {warning.length} due soon
              </span>
            )}
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-4 pt-0">
              {/* Notification toggle */}
              {isNotificationsSupported() && (
                <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-paper px-3 py-2 text-xs">
                  <span className="flex items-center gap-1.5 text-text-secondary">
                    {notifEnabled ? (
                      <Bell size={12} className="text-success" />
                    ) : (
                      <BellOff size={12} className="text-text-muted" />
                    )}
                    {notifEnabled
                      ? "Deadline reminders on"
                      : "Enable reminders for approaching deadlines"}
                  </span>
                  {!notifEnabled && (
                    <button
                      onClick={handleEnableNotifications}
                      className="font-semibold text-saffron hover:underline"
                    >
                      Enable
                    </button>
                  )}
                </div>
              )}

              {/* Deadline rows */}
              {deadlines.length > 0 ? (
                <div className="space-y-2">
                  {[...overdue, ...warning, ...ok].map((d) => (
                    <DeadlineRow key={d.procedureId} deadline={d} />
                  ))}
                </div>
              ) : null}

              {/* Untracked procedures — "Mark as submitted" prompts */}
              {trackable
                .filter((p) => !submittedDates[p.procedure_id])
                .map((p) => {
                  const name = p.procedure_id
                    .replace(/^tn_/, "")
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase());
                  return (
                    <div
                      key={p.procedure_id}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-paper-dark bg-paper/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <FileText size={12} className="text-text-muted" />
                        <span className="text-text-secondary">{name}</span>
                      </div>
                      <button
                        onClick={() => handleMarkSubmitted(p.procedure_id)}
                        className="shrink-0 rounded-full bg-saffron-light px-2.5 py-1 text-[10px] font-semibold text-saffron-dark hover:bg-saffron/20 transition-colors"
                      >
                        Mark submitted today
                      </button>
                    </div>
                  );
                })}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function DeadlineRow({ deadline: d }: { deadline: DeadlineStatus }) {
  const urgencyConfig = {
    ok: {
      bar: "bg-success",
      text: "text-success",
      bg: "bg-success/10 border-success/20",
      icon: CheckCircle,
      label: `${d.daysRemaining} days left`,
    },
    warning: {
      bar: "bg-warning",
      text: "text-warning-dark",
      bg: "bg-warning/10 border-warning/30",
      icon: Clock,
      label: `${d.daysRemaining} days left — act soon`,
    },
    overdue: {
      bar: "bg-danger",
      text: "text-danger",
      bg: "bg-danger/10 border-danger/20",
      icon: AlertTriangle,
      label: `${Math.abs(d.daysRemaining)} days overdue`,
    },
  };

  const cfg = urgencyConfig[d.urgency];
  const Icon = cfg.icon;
  const progress = Math.min(
    100,
    Math.round((d.daysElapsed / d.statutoryDays) * 100)
  );

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border p-3 text-xs",
        cfg.bg
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-navy">{d.procedureName}</p>
          <p className="text-text-muted">
            Submitted {new Date(d.submittedDate).toLocaleDateString("en-IN")} ·
            Statutory limit: {d.statutoryDays} days
          </p>
        </div>
        <span className={cn("flex items-center gap-1 font-semibold shrink-0", cfg.text)}>
          <Icon size={12} />
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", cfg.bar)}
        />
      </div>

      {/* Overdue action */}
      {d.urgency === "overdue" && (
        <p className="mt-2 text-danger font-medium">
          The statutory limit under TN RTS Act 2010 has passed.
          You have the right to file a complaint or RTI.
        </p>
      )}
    </div>
  );
}
