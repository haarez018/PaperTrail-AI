"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Clock, IndianRupee, ArrowRight, Download, GitBranch,
  AlertCircle, MapPin, ClipboardList, Printer, Plus, Send,
  Scale, Phone, Briefcase, Search, Languages, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Suggestion } from "@/lib/suggestions";

/* ── Icon map ── */
const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Clock, IndianRupee, ArrowRight, Download, GitBranch,
  AlertCircle, MapPin, ClipboardList, Printer, Plus, Send,
  Scale, Phone, Briefcase, Search, Languages,
};

function SuggIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? ArrowRight;
  return <Icon size={12} />;
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (s: Suggestion) => void;
  visible: boolean;
}

/**
 * Horizontally scrollable chip row of context-aware action suggestions.
 * Appears above the chat input after each agent response.
 */
export function SmartSuggestions({
  suggestions,
  onSelect,
  visible,
}: SmartSuggestionsProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  // Show fade indicator when chips overflow
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const check = () => setShowFade(el.scrollWidth > el.clientWidth + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [suggestions]);

  return (
    <AnimatePresence>
      {visible && suggestions.length > 0 && (
        <motion.div
          key="suggestions"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="relative px-4 pb-2"
        >
          {/* Label */}
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Suggested next steps
          </p>

          {/* Chip row */}
          <div
            ref={rowRef}
            className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => onSelect(s)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5",
                  "text-xs font-medium transition-all duration-150",
                  "border-paper-dark bg-surface text-text-secondary",
                  "hover:border-saffron/50 hover:bg-saffron-light/40 hover:text-navy",
                  "active:scale-95"
                )}
              >
                <span className="text-text-muted">
                  <SuggIcon name={s.icon} />
                </span>
                {s.label}
              </motion.button>
            ))}
          </div>

          {/* Right fade gradient when overflowing */}
          {showFade && (
            <div className="pointer-events-none absolute right-0 top-[22px] flex h-[calc(100%-22px)] w-12 items-center justify-end bg-gradient-to-l from-ivory to-transparent pr-1">
              <ChevronRight size={12} className="text-text-muted" />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
