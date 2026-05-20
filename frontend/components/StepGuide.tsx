"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronRight, Lightbulb } from "lucide-react";
import { t, type SupportedLang } from "@/lib/i18n";
import {
  GUIDE_STEPS,
  GUIDE_DISMISSED_KEY,
  GUIDE_AUTO_HIDE_AFTER,
  type GuideContext,
} from "@/lib/guideSteps";
import { cn } from "@/lib/cn";

interface StepGuideProps {
  language: string;
  messageCount: number;
  isLoading: boolean;
  hasPlan: boolean;
  selectedProcedure: string | null;
  totalProcedures: number;
  viewedProcedures: Set<string>;
}

const STEP_TITLES = [
  "guide_step1_title",
  "guide_step2_title",
  "guide_step3_title",
  "guide_step4_title",
  "guide_step5_title",
  "guide_step6_title",
] as const;

const STEP_BODIES = [
  "guide_step1_body",
  "guide_step2_body",
  "guide_step3_body",
  "guide_step4_body",
  "guide_step5_body",
  "guide_step6_body",
] as const;

export function StepGuide({
  language,
  messageCount,
  isLoading,
  hasPlan,
  selectedProcedure,
  totalProcedures,
  viewedProcedures,
}: StepGuideProps) {
  const lang = (["en", "ta", "hi"].includes(language) ? language : "en") as SupportedLang;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(GUIDE_DISMISSED_KEY) === "true";
  });

  // Track seconds spent on procedure detail without downloading
  const [secondsOnDetail, setSecondsOnDetail] = useState(0);
  const detailTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track how many distinct procedures have been viewed
  const viewedProcedureCount = viewedProcedures.size;

  // Reset detail timer when procedure changes
  useEffect(() => {
    if (detailTimerRef.current) clearInterval(detailTimerRef.current);
    if (selectedProcedure) {
      setSecondsOnDetail(0);
      detailTimerRef.current = setInterval(() => {
        setSecondsOnDetail((s) => s + 1);
      }, 1000);
    } else {
      setSecondsOnDetail(0);
    }
    return () => {
      if (detailTimerRef.current) clearInterval(detailTimerRef.current);
    };
  }, [selectedProcedure]);

  const ctx: GuideContext = {
    messageCount,
    isLoading,
    hasPlan,
    selectedProcedure,
    secondsOnDetail,
    viewedProcedureCount,
    totalProcedures,
  };

  // Find the highest-priority active step (last one that matches)
  const activeStep = [...GUIDE_STEPS].reverse().find((s) => s.shouldShow(ctx)) ?? null;

  const visible =
    !dismissed &&
    activeStep !== null &&
    messageCount < GUIDE_AUTO_HIDE_AFTER;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(GUIDE_DISMISSED_KEY, "true");
  };

  const stepIndex = activeStep ? activeStep.id - 1 : 0;

  return (
    <AnimatePresence>
      {visible && activeStep && (
        <motion.div
          key={`guide-step-${activeStep.id}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "fixed bottom-[88px] left-1/2 z-40",
            "-translate-x-1/2",
            "w-[min(520px,calc(100vw-32px))]",
          )}
          role="status"
          aria-live="polite"
          aria-label={`Guide step ${activeStep.id} of ${GUIDE_STEPS.length}`}
        >
          <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-saffron/30 bg-surface/95 px-4 py-3 shadow-modal backdrop-blur-sm">
            {/* Icon */}
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-saffron-light">
              <Lightbulb size={14} className="text-saffron-dark" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug text-navy">
                {t(lang, STEP_TITLES[stepIndex])}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                {t(lang, STEP_BODIES[stepIndex])}
              </p>
            </div>

            {/* Step counter dots */}
            <div className="flex shrink-0 items-center gap-1 pt-1">
              {GUIDE_STEPS.map((s) => (
                <span
                  key={s.id}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    s.id === activeStep.id
                      ? "w-3 bg-saffron"
                      : "w-1.5 bg-paper-dark"
                  )}
                />
              ))}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded p-1 text-text-muted transition-colors hover:bg-paper hover:text-text-primary"
              title={t(lang, "guide_dismiss")}
              aria-label={t(lang, "guide_dismiss")}
            >
              <X size={13} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
