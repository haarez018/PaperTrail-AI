"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { SHORTCUT_DEFS } from "@/lib/shortcuts";
import { cn } from "@/lib/cn";

const isMac =
  typeof window !== "undefined" &&
  /Mac|iPad|iPhone|iPod/.test(navigator.platform);

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-paper-dark bg-paper px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-secondary shadow-sm">
      {children}
    </kbd>
  );
}

function ShortcutKey({
  ctrl,
  shift,
  keyStr,
}: {
  ctrl?: boolean;
  shift?: boolean;
  keyStr: string;
}) {
  const mod = isMac ? "⌘" : "Ctrl";
  const parts: string[] = [];
  if (ctrl) parts.push(mod);
  if (shift) parts.push("⇧");
  if (keyStr !== "Escape") {
    parts.push(keyStr.toUpperCase());
  } else {
    parts.push("Esc");
  }
  return (
    <span className="flex items-center gap-1">
      {parts.map((p, i) => (
        <Kbd key={i}>{p}</Kbd>
      ))}
    </span>
  );
}

/**
 * Global keyboard shortcuts reference modal.
 * Opens via Ctrl+/ shortcut or programmatically.
 */
export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-navy/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className={cn(
              "fixed z-[100] w-[min(90vw,400px)]",
              "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "rounded-[var(--radius-xl)] bg-surface border border-paper-dark shadow-card-hover overflow-hidden"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-paper-dark px-5 py-4">
              <div className="flex items-center gap-2">
                <Keyboard size={16} className="text-saffron" />
                <h2 className="font-display text-base text-navy">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-text-muted hover:bg-paper hover:text-navy transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="divide-y divide-paper-dark">
              {SHORTCUT_DEFS.map((s) => (
                <div
                  key={`${s.ctrl ? "c" : ""}${s.key}`}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <span className="text-sm text-text-secondary">{s.description}</span>
                  <ShortcutKey ctrl={s.ctrl} shift={s.shift} keyStr={s.key} />
                </div>
              ))}
            </div>

            <div className="border-t border-paper-dark px-5 py-3 text-xs text-text-muted text-center">
              Press <Kbd>Esc</Kbd> to close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
