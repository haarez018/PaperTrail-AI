"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  FolderOpen,
  BookOpen,
  BarChart2,
  Palette,
  Plus,
  Moon,
  Languages,
  Keyboard,
  Download,
  Share2,
  ArrowRight,
  Command,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  STATIC_COMMANDS,
  filterCommands,
  CATEGORY_LABELS,
  Command as Cmd,
  CommandCategory,
  StaticCommandDef,
} from "@/lib/commands";
import type { ProcedurePlan } from "@/lib/api";

/* ── Icon lookup ── */
const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  FolderOpen,
  BookOpen,
  BarChart2,
  Palette,
  Plus,
  Moon,
  Languages,
  Keyboard,
  Download,
  Share2,
};

function CmdIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? Command;
  return <Icon size={size} />;
}

/* ── Kbd chip ── */
function Kbd({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded border border-paper-dark bg-paper px-1 py-0.5 font-mono text-[9px] text-text-muted">
      {children}
    </span>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  plan?: ProcedurePlan | null;
  caseId?: string | null;
  onNewCase?: () => void;
  onSetLanguage?: (lang: string) => void;
  onShowShortcuts?: () => void;
}

export function CommandPalette({
  open,
  onClose,
  plan,
  caseId,
  onNewCase,
  onSetLanguage,
  onShowShortcuts,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* ── Build full command list ── */
  const allCommands = useMemo<Cmd[]>(() => {
    const actions: Record<string, () => void> = {
      "action-new-case": () => { onNewCase?.(); onClose(); },
      "action-theme": () => {
        const stored = localStorage.getItem("nyayamitra-theme") ?? "system";
        const next = stored === "light" ? "dark" : stored === "dark" ? "system" : "light";
        localStorage.setItem("nyayamitra-theme", next);
        const root = document.documentElement;
        root.classList.remove("light", "dark");
        if (next === "dark") root.classList.add("dark");
        else if (next === "light") root.classList.add("light");
        onClose();
      },
      "action-lang-ta": () => { onSetLanguage?.("ta"); onClose(); },
      "action-lang-hi": () => { onSetLanguage?.("hi"); onClose(); },
      "action-lang-en": () => { onSetLanguage?.("en"); onClose(); },
      "action-shortcuts": () => { onShowShortcuts?.(); onClose(); },
      "action-export-kit": () => {
        if (caseId) {
          document.querySelector<HTMLButtonElement>("[data-export-kit]")?.click();
        }
        onClose();
      },
      "action-share": () => {
        document.querySelector<HTMLButtonElement>("[data-share-card]")?.click();
        onClose();
      },
    };

    const cmds: Cmd[] = STATIC_COMMANDS.map((def: StaticCommandDef) => ({
      ...def,
      action: actions[def.id] ?? (() => {
        if (def.href) { router.push(def.href); onClose(); }
      }),
    }));

    // Inject procedure commands from active plan
    if (plan) {
      plan.procedures.slice(0, 6).forEach((proc, i) => {
        const name = proc.procedure_id
          .replace(/^tn_/, "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        cmds.push({
          id: `proc-${proc.procedure_id}`,
          label: name,
          description: proc.why_this_is_needed?.slice(0, 60) || `Step ${proc.order}`,
          category: "procedure" as CommandCategory,
          icon: "ArrowRight",
          keywords: [proc.procedure_id, "step", `${proc.order}`],
          action: () => {
            document
              .querySelector<HTMLElement>(`[data-proc-id="${proc.procedure_id}"]`)
              ?.click();
            onClose();
          },
        });
      });
    }

    return cmds;
  }, [plan, caseId, onNewCase, onSetLanguage, onShowShortcuts, onClose, router]);

  const filtered = useMemo(
    () => filterCommands(allCommands, query),
    [allCommands, query]
  );

  /* Group by category */
  const grouped = useMemo(() => {
    const map = new Map<CommandCategory, Cmd[]>();
    filtered.forEach((cmd) => {
      const arr = map.get(cmd.category) ?? [];
      arr.push(cmd);
      map.set(cmd.category, arr);
    });
    return map;
  }, [filtered]);

  const flatFiltered = filtered; // for index tracking

  /* ── Reset on open ── */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatFiltered[activeIdx]?.action();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatFiltered, activeIdx, onClose]);

  /* Scroll active item into view */
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  /* Reset active on query change */
  useEffect(() => { setActiveIdx(0); }, [query]);

  const execute = useCallback((cmd: Cmd) => {
    cmd.action();
  }, []);

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] bg-navy/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="cp-panel"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-1/2 top-[15vh] z-[100] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-paper-dark bg-surface shadow-2xl"
          >
            {/* Search bar */}
            <div className="flex items-center gap-3 border-b border-paper-dark px-4 py-3">
              <Search size={16} className="shrink-0 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, pages, procedures…"
                className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              />
              <Kbd>Esc</Kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2 scrollbar-thin">
              {flatFiltered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  No commands match &ldquo;{query}&rdquo;
                </p>
              ) : (
                Array.from(grouped.entries()).map(([category, cmds]) => (
                  <div key={category} className="mb-1">
                    <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      {CATEGORY_LABELS[category]}
                    </p>
                    {cmds.map((cmd) => {
                      const idx = globalIdx++;
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={cmd.id}
                          data-active={isActive}
                          onClick={() => execute(cmd)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                            isActive
                              ? "bg-saffron/10 text-navy"
                              : "text-text-primary hover:bg-paper/50"
                          )}
                        >
                          <span className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border",
                            isActive
                              ? "border-saffron/30 bg-saffron/10 text-saffron"
                              : "border-paper-dark bg-paper text-text-muted"
                          )}>
                            <CmdIcon name={cmd.icon} size={13} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{cmd.label}</p>
                            {cmd.description && (
                              <p className="text-[11px] text-text-muted truncate">{cmd.description}</p>
                            )}
                          </div>
                          {"shortcut" in cmd && (cmd as StaticCommandDef).shortcut && (
                            <Kbd>{(cmd as StaticCommandDef).shortcut!}</Kbd>
                          )}
                          {isActive && (
                            <ArrowRight size={12} className="shrink-0 text-saffron" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-paper-dark px-4 py-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-2">
                <Kbd>↑↓</Kbd> navigate
                <Kbd>↵</Kbd> select
                <Kbd>Esc</Kbd> close
              </span>
              <span className="flex items-center gap-1">
                <Command size={9} /> K
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
