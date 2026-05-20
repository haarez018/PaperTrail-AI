"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Scale, Copy, Check, FolderOpen, Star, Volume2, VolumeX, FileDown, Loader2 } from "lucide-react";
import { LanguageToggle, ThemeToggle } from "@/components/ui";
import type { SupportedLanguage } from "@/components/ui";
import { SystemStatus } from "@/components/SystemStatus";
import { setSoundEnabled, isSoundEnabled } from "@/lib/sounds";
import { cn } from "@/lib/cn";

interface ChatHeaderProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  caseId: string | null;
  messages?: { role: "user" | "agent"; content: string; agent?: string }[];
}

/** Sticky header with PaperTrail AI branding, case ID copy, and toggles. */
export function ChatHeader({ language, onLanguageChange, caseId, messages = [] }: ChatHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [exporting, setExporting] = useState(false);

  const handleExportChat = async () => {
    if (!caseId || messages.length === 0 || exporting) return;
    setExporting(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${API}/api/case/${caseId}/export-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error("Export failed");
      const { pdf_base64, filename } = await res.json();
      // Decode and download
      const binary = atob(pdf_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? `papertrail-chat-${caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Chat export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-dark bg-surface/90 px-3 py-2.5 backdrop-blur-sm sm:px-6 sm:py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-light">
          <Scale size={18} className="text-saffron-dark" />
        </div>
        <div>
          <h1 className="font-display text-lg leading-tight text-navy">
            PaperTrail AI
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

      <div className="flex items-center gap-1 sm:gap-2">
        <SystemStatus />
        {/* Stories + Cases links — text label hidden on mobile */}
        <Link
          href="/stories"
          className="hidden xs:inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-text-muted hover:bg-paper hover:text-navy transition-colors"
          title="Success stories"
        >
          <Star size={14} />
          <span className="hidden sm:inline">Stories</span>
        </Link>
        <Link
          href="/cases"
          className="hidden xs:inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-xs text-text-muted hover:bg-paper hover:text-navy transition-colors"
          title="View all cases"
        >
          <FolderOpen size={14} />
          <span className="hidden sm:inline">Cases</span>
        </Link>
        {caseId && messages.length > 0 && (
          <button
            onClick={handleExportChat}
            disabled={exporting}
            className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] p-1.5 text-xs text-text-muted hover:bg-paper hover:text-navy transition-colors disabled:opacity-50"
            title="Export conversation as PDF"
            aria-label="Export chat as PDF"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
        <button
          onClick={toggleSound}
          className="rounded-[var(--radius-sm)] p-1.5 text-text-muted transition-colors hover:bg-paper hover:text-text-primary"
          title={soundOn ? "Mute sounds" : "Enable sounds"}
          aria-label={soundOn ? "Mute sounds" : "Enable sounds"}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
        <LanguageToggle
          value={language as SupportedLanguage}
          onChange={(lang) => onLanguageChange(lang)}
        />
        <ThemeToggle />
      </div>
    </header>
  );
}
