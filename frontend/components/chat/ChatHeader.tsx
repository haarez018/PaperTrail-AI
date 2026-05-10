"use client";

import { Scale } from "lucide-react";
import { LanguageToggle, ThemeToggle } from "@/components/ui";
import type { SupportedLanguage } from "@/components/ui";

interface ChatHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  caseId: string | null;
}

/** Sticky header with NyayaMitra branding and language toggle. */
export function ChatHeader({ language, onLanguageChange, caseId }: ChatHeaderProps) {
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
              <span className="font-mono">{caseId}</span>
            ) : (
              "Your Bureaucracy Navigator"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageToggle
          value={language as SupportedLanguage}
          onChange={(lang) => onLanguageChange(lang)}
        />
        <ThemeToggle />
      </div>
    </header>
  );
}
