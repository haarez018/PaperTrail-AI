"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/cn";

export type SupportedLanguage = "en" | "ta" | "hi";

const languageLabels: Record<SupportedLanguage, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  ta: { short: "தமி", full: "தமிழ்" },
  hi: { short: "हिं", full: "हिन्दी" },
};

export interface LanguageToggleProps {
  value?: SupportedLanguage;
  onChange?: (lang: SupportedLanguage) => void;
  className?: string;
}

/** Compact language switcher — en / ta / hi. */
export function LanguageToggle({
  value: controlledValue,
  onChange,
  className,
}: LanguageToggleProps) {
  const [internalValue, setInternalValue] = useState<SupportedLanguage>("en");
  const current = controlledValue ?? internalValue;

  const handleChange = (lang: SupportedLanguage) => {
    if (lang === current) return;
    setInternalValue(lang);
    onChange?.(lang);
  };

  const languages: SupportedLanguage[] = ["en", "ta", "hi"];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-paper-dark bg-white p-1",
        className
      )}
      role="radiogroup"
      aria-label="Language selector"
    >
      <Globe size={14} className="ml-1.5 text-text-muted" aria-hidden="true" />
      {languages.map((lang) => (
        <button
          key={lang}
          role="radio"
          aria-checked={current === lang}
          aria-label={languageLabels[lang].full}
          onClick={() => handleChange(lang)}
          className={cn(
            "rounded-[var(--radius-sm)] px-2 py-1 text-xs font-semibold transition-all duration-[var(--duration-fast)]",
            current === lang
              ? "bg-saffron text-white shadow-sm"
              : "text-text-muted hover:bg-paper hover:text-text-primary"
          )}
        >
          {languageLabels[lang].short}
        </button>
      ))}
    </div>
  );
}
