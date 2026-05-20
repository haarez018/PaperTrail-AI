"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Scale } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  TUTORIAL_STEPS,
  isTutorialCompleted,
  markTutorialCompleted,
} from "@/lib/onboarding";

/**
 * 5-step interactive onboarding overlay for first-time visitors.
 * Renders a centred modal card with step progress dots.
 * Persists completion in localStorage so it never shows again.
 */
export function Onboarding() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isTutorialCompleted()) {
      // Small delay so the page loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    markTutorialCompleted();
    setVisible(false);
  };

  const next = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Dimmed backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-navy/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Tutorial card */}
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "fixed z-[110] w-[min(90vw,420px)]",
              "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "rounded-[var(--radius-xl)] bg-surface shadow-card-hover border border-paper-dark overflow-hidden"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={`Tutorial step ${step + 1} of ${TUTORIAL_STEPS.length}: ${current.title}`}
          >
            {/* Saffron accent bar */}
            <div className="h-1 bg-saffron" style={{ width: `${((step + 1) / TUTORIAL_STEPS.length) * 100}%`, transition: "width 0.4s ease" }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron-light">
                  <Scale size={16} className="text-saffron-dark" />
                </div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
                  PaperTrail AI Tour · {step + 1}/{TUTORIAL_STEPS.length}
                </span>
              </div>
              <button
                onClick={dismiss}
                className="rounded-full p-1 text-text-muted hover:bg-paper hover:text-navy transition-colors"
                aria-label="Skip tutorial"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-2">
              <h2 className="font-display text-xl text-navy mb-2">
                {current.title}
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {current.description}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 py-4">
              {TUTORIAL_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-[var(--duration-base)]",
                    i === step
                      ? "w-6 bg-saffron"
                      : i < step
                      ? "w-2 bg-saffron/40"
                      : "w-2 bg-paper-dark"
                  )}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-paper-dark px-6 py-4">
              <button
                onClick={dismiss}
                className="text-sm text-text-muted hover:text-navy underline transition-colors"
              >
                Skip tutorial
              </button>

              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-paper-dark px-3 py-1.5 text-sm text-text-secondary hover:border-saffron/40 hover:text-navy transition-all"
                  >
                    <ChevronLeft size={14} />
                    Back
                  </button>
                )}
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-saffron px-4 py-1.5 text-sm font-semibold text-white hover:bg-saffron-dark transition-colors"
                >
                  {isLast ? "Let's go!" : "Next"}
                  {!isLast && <ChevronRight size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
