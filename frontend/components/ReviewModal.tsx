"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";

interface ReviewData {
  rating: number;
  comment: string;
  procedure_name: string;
  case_id: string;
}

interface ReviewModalProps {
  caseId: string;
  language: string;
  onSubmit: (data: ReviewData) => Promise<void>;
  onClose: () => void;
}

const STAR_LABELS = ["", "Poor 😕", "Okay 😐", "Good 🙂", "Great 😊", "Excellent 🤩"];

export default function ReviewModal({ caseId, language, onSubmit, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [procedureName, setProcedureName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment, procedure_name: procedureName, case_id: caseId });
      setSubmitted(true);
      setTimeout(() => onClose(), 1800);
    } catch {
      setSubmitting(false);
    }
  };

  const displayStar = hovered || rating;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="panel"
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 20, stiffness: 280 }}
          className="relative w-full max-w-sm rounded-[var(--radius-lg)] bg-surface p-6 shadow-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Rate your experience"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-[var(--radius-sm)] p-1 text-text-muted transition-colors hover:bg-paper hover:text-text-primary"
            aria-label="Close review modal"
          >
            <X size={18} />
          </button>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="thanks"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.08 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron-light"
                >
                  <Star size={32} className="fill-saffron text-saffron" />
                </motion.div>
                <h3 className="font-display text-xl text-navy">Thank you!</h3>
                <p className="text-sm text-text-secondary">Your feedback helps us improve.</p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }} className="space-y-5">
                <div className="text-center">
                  <h3 className="font-display text-xl text-navy">Rate Your Experience</h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    How did PaperTrail AI help you today?
                  </p>
                </div>

                {/* Stars */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1" role="group" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(star)}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                      >
                        <Star
                          size={36}
                          className={`transition-colors duration-100 ${
                            star <= displayStar
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-transparent text-text-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="h-5 text-sm font-medium text-saffron-dark">
                    {displayStar > 0 ? STAR_LABELS[displayStar] : ""}
                  </span>
                </div>

                {/* Comment */}
                <div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    placeholder="Share your experience (optional)"
                    rows={3}
                    className="w-full resize-none rounded-[var(--radius-sm)] border border-paper-dark bg-ivory px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-saffron focus:outline-none"
                  />
                  <p className="mt-1 text-right text-xs text-text-muted">{comment.length}/500</p>
                </div>

                {/* Procedure name */}
                <input
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="Which procedure? (optional)"
                  className="w-full rounded-[var(--radius-sm)] border border-paper-dark bg-ivory px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-saffron focus:outline-none"
                />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-[var(--radius-sm)] border border-paper-dark px-4 py-2 text-sm text-text-muted transition-colors hover:bg-paper"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="flex-1 rounded-[var(--radius-sm)] bg-saffron px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-saffron-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
