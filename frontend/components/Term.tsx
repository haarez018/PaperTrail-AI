"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X } from "lucide-react";
import { cn } from "@/lib/cn";
import glossaryRaw from "@/lib/glossary.json";

interface GlossaryEntry {
  full: string;
  definition: string;
  tamil?: string;
}

const glossary = glossaryRaw as Record<string, GlossaryEntry>;

interface TermProps {
  /** The term text to display and look up. Must match a glossary key exactly. */
  term: string;
  /** Optional override for displayed text (default: term key). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Inline glossary term with hover/click tooltip.
 * Wrap any bureaucratic term: <Term term="RTI">Right to Information</Term>
 * If the term isn't in the glossary it renders as plain text.
 */
export function Term({ term, children, className }: TermProps) {
  const entry = glossary[term];
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<"above" | "below">("above");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Determine tooltip direction based on available space
  const computePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos(rect.top > 180 ? "above" : "below");
  }, []);

  useEffect(() => {
    if (open) computePos();
  }, [open, computePos]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !tooltipRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // If not in glossary, render plain
  if (!entry) {
    return <span className={className}>{children ?? term}</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline cursor-help border-b border-dashed border-saffron/60 text-inherit",
          "hover:border-saffron hover:text-saffron-dark transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron/50",
          className
        )}
        aria-label={`Glossary: ${term}`}
        aria-expanded={open}
      >
        {children ?? term}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={tooltipRef}
            key="tooltip"
            initial={{ opacity: 0, y: pos === "above" ? 6 : -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: pos === "above" ? 6 : -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute left-0 z-[80] w-[240px] rounded-[var(--radius-md)] border border-paper-dark",
              "bg-surface px-3 py-2.5 shadow-card-hover text-xs",
              pos === "above" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
            )}
            role="tooltip"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <BookOpen size={11} className="shrink-0 text-saffron" />
                <span className="font-semibold text-navy">{entry.full}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 text-text-muted hover:text-navy transition-colors"
                aria-label="Close"
              >
                <X size={11} />
              </button>
            </div>

            {/* Definition */}
            <p className="leading-relaxed text-text-secondary">{entry.definition}</p>

            {/* Tamil gloss */}
            {entry.tamil && (
              <p className="mt-1.5 font-medium text-saffron-dark">{entry.tamil}</p>
            )}

            {/* Glossary label */}
            <p className="mt-2 text-[9px] uppercase tracking-widest text-text-muted">
              PaperTrail AI Glossary
            </p>

            {/* Caret */}
            <span
              className={cn(
                "absolute left-4 h-2 w-2 rotate-45 border border-paper-dark bg-surface",
                pos === "above"
                  ? "bottom-[-5px] border-t-0 border-l-0"
                  : "top-[-5px] border-b-0 border-r-0"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

/**
 * Auto-annotates a plain string, wrapping known glossary terms with <Term>.
 * Use for rendering agent responses that may contain bureaucratic vocabulary.
 */
export function AnnotatedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length); // longest first

  // Build regex that matches any glossary term (word-boundary aware)
  const pattern = new RegExp(
    `\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
    "g"
  );

  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(
      <Term key={`${match[1]}-${match.index}`} term={match[1]}>
        {match[1]}
      </Term>
    );
    last = match.index + match[1].length;
  }

  if (last < text.length) parts.push(text.slice(last));

  return <span className={className}>{parts}</span>;
}
