"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Scale, Copy, Check, FolderOpen, Star } from "lucide-react";
import { LanguageToggle, ThemeToggle } from "@/components/ui";
import type { SupportedLanguage } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ChatHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  caseId: string | null;
}

/** Sticky header with NyayaMitra branding, case ID copy, and toggles. */
export function ChatHeader({ language, onLanguageChange, caseId }: ChatHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = useCallback(async () => {
    if (!caseId) return;
    try {
      await navigator.clipboard.writeText(caseId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = caseId;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [caseId]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-dark bg-surface/90 px-4 py-3 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-light">
          <Scale size={18} className="text-saffron-dark" />
        </div>
        <div>
          <h1 className="font-display text-lg leading-tight text-navy">
            NyayaMitra
          </h1>
          <p className="text-xs text-text-muted">
            {caseId ? (
              <button
                onClick={handleCopyId}
                className={cn(
                  "group inline-flex items-center gap-1 font-mono transition-colors duration-[var(--duration-fast)]",
                  "hover:text-saffron active:text-saffron-dark"
                )}
                title="Click to copy Case ID"
                aria-label={`Copy case ID ${caseId}`}
              >
                {caseId}
                {copied ? (
                  <Check size={11} className="text-success animate-copy-tick" />
                ) : (
                  <Copy size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            ) : (
              "Your Bureaucracy Navigator"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/stories"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-text-muted hover:bg-paper hover:text-navy transition-colors"
          title="Success stories"
        >
          <Star size={14} />
          <span className="hidden sm:inline">Stories</span>
        </Link>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-text-muted hover:bg-paper hover:text-navy transition-colors"
          title="View all cases"
        >
          <FolderOpen size={14} />
          <span className="hidden sm:inline">Cases</span>
        </Link>
        <LanguageToggle
          value={language as SupportedLanguage}
          onChange={(lang) => onLanguageChange(lang)}
        />
        <ThemeToggle />
      </div>
    </header>
  );
}
