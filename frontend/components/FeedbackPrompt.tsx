"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Send, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface FeedbackPromptProps {
  /** Context label shown in the prompt (e.g. "the plan" or "Death Certificate step") */
  context?: string;
  caseId?: string | null;
  procedureId?: string | null;
  language?: string;
  /** Called when the user dismisses without rating */
  onDismiss?: () => void;
}

type FeedbackState = "idle" | "rated" | "commented" | "submitted" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Inline thumbs-up / thumbs-down feedback prompt.
 * Appears after a plan is generated or after a procedure detail is viewed.
 * Sends POST /api/feedback and gracefully disappears after submission.
 */
export function FeedbackPrompt({
  context = "this",
  caseId,
  procedureId,
  language = "en",
  onDismiss,
}: FeedbackPromptProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState("");
  const [visible, setVisible] = useState(true);

  const handleRate = (r: 1 | -1) => {
    setRating(r);
    setState("rated");
  };

  const handleSubmit = async (withComment = false) => {
    if (rating === null) return;

    try {
      await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId ?? null,
          procedure_id: procedureId ?? null,
          rating,
          comment: withComment && comment.trim() ? comment.trim() : null,
          language,
        }),
      });
      setState("submitted");
      setTimeout(() => setVisible(false), 2200);
    } catch {
      setState("error");
      setTimeout(() => setState("rated"), 2000);
    }
  };

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="feedback"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-[var(--radius-md)] border border-paper-dark bg-paper px-4 py-3"
        >
          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="absolute right-2 top-2 rounded p-1 text-text-muted hover:text-navy transition-colors"
            aria-label="Dismiss feedback"
          >
            <X size={12} />
          </button>

          {/* ── Idle: ask for rating ── */}
          {(state === "idle") && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-text-secondary flex-1">
                Was {context} helpful?
              </p>
              <button
                onClick={() => handleRate(1)}
                className="inline-flex items-center gap-1 rounded-full border border-paper-dark bg-surface px-2.5 py-1 text-xs text-text-muted hover:border-success/40 hover:text-success hover:bg-green-50 transition-colors"
                aria-label="Thumbs up"
              >
                <ThumbsUp size={12} /> Yes
              </button>
              <button
                onClick={() => handleRate(-1)}
                className="inline-flex items-center gap-1 rounded-full border border-paper-dark bg-surface px-2.5 py-1 text-xs text-text-muted hover:border-danger/40 hover:text-danger hover:bg-red-50 transition-colors"
                aria-label="Thumbs down"
              >
                <ThumbsDown size={12} /> No
              </button>
            </div>
          )}

          {/* ── Rated: offer comment ── */}
          {state === "rated" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                {rating === 1
                  ? <ThumbsUp size={13} className="text-success" />
                  : <ThumbsDown size={13} className="text-danger" />}
                <p className="text-xs text-text-secondary flex-1">
                  {rating === 1
                    ? "Great! Anything we could do even better?"
                    : "Sorry to hear that. What went wrong?"}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(true)}
                  placeholder="Optional comment…"
                  className="flex-1 rounded-[var(--radius-sm)] border border-paper-dark bg-surface px-2.5 py-1 text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-saffron/60 transition-colors"
                  maxLength={200}
                />
                <button
                  onClick={() => handleSubmit(true)}
                  className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-saffron px-3 py-1 text-xs font-medium text-white hover:bg-saffron-dark transition-colors"
                >
                  <Send size={11} /> Send
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  className="text-xs text-text-muted hover:text-navy transition-colors px-1"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Submitted ── */}
          {state === "submitted" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 py-0.5"
            >
              <CheckCircle size={14} className="text-success" />
              <p className="text-xs text-text-secondary">
                Thanks for your feedback — it helps us improve.
              </p>
            </motion.div>
          )}

          {/* ── Error ── */}
          {state === "error" && (
            <p className="text-xs text-danger">Couldn&apos;t save feedback. Try again?</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
