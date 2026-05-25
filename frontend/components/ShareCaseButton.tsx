"use client";
import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

interface Props {
  caseId: string;
  procedureCount: number;
  estimatedDays: number;
}

export function ShareCaseButton({ caseId, procedureCount, estimatedDays }: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/case/${caseId}`
      : `https://papertrail.ai/case/${caseId}`;

  const waText = encodeURIComponent(
    `I'm navigating ${procedureCount} government procedures with PaperTrail AI (est. ${estimatedDays} days, completely free).\n\nTrack my progress: ${url}`
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-paper-dark bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:border-saffron/40 hover:text-saffron-dark transition-colors"
      >
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1ea855] transition-colors"
      >
        <MessageCircle size={14} />
        Share on WhatsApp
      </a>
    </div>
  );
}
