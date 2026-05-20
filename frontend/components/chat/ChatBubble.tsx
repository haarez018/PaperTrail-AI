"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";

export interface ChatBubbleProps {
  role: "user" | "agent";
  content: string;
  agent?: string;
  timestamp?: number;
  /** Index used to stagger entrance animation. */
  index?: number;
  /** If true, applies character-by-character typing animation. */
  isLatest?: boolean;
}

const agentLabels: Record<string, string> = {
  intake: "Intake Agent",
  planner: "Planning Agent",
  procedure: "Planning Agent",
  document: "Document Agent",
  navigation: "Navigation Agent",
  escalation: "Escalation Agent",
  orchestrator: "PaperTrail AI",
  done: "PaperTrail AI",
};

// ── Markdown line renderer ────────────────────────────────────────────────────

function renderLine(line: string, idx: number): React.ReactNode {
  // Horizontal rule
  if (/^---+$/.test(line.trim())) {
    return <hr key={idx} className="my-2 border-paper-dark" />;
  }

  // H2 heading
  if (line.startsWith("## ")) {
    return (
      <h2 key={idx} className="mt-3 mb-1 font-display text-base font-bold text-navy">
        {applyInline(line.slice(3))}
      </h2>
    );
  }

  // H3 heading
  if (line.startsWith("### ")) {
    return (
      <h3 key={idx} className="mt-2 mb-0.5 text-sm font-semibold text-navy">
        {applyInline(line.slice(4))}
      </h3>
    );
  }

  // Numbered list  "1. text"
  const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (numMatch) {
    return (
      <div key={idx} className="flex items-start gap-2 my-0.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron text-[10px] font-bold text-white">
          {numMatch[1]}
        </span>
        <span className="text-sm leading-relaxed">{applyInline(numMatch[2])}</span>
      </div>
    );
  }

  // Bullet list  "• text" or "- text"
  const bulletMatch = line.match(/^[•\-]\s+(.+)$/);
  if (bulletMatch) {
    return (
      <div key={idx} className="flex items-start gap-2 my-0.5 pl-1">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
        <span className="text-sm leading-relaxed">{applyInline(bulletMatch[1])}</span>
      </div>
    );
  }

  // Arrow continuation  "➡️ text" / "→ text"
  if (line.startsWith("➡️") || line.startsWith("→")) {
    return (
      <div key={idx} className="mt-2 flex items-start gap-1.5 rounded-[var(--radius-sm)] bg-saffron/8 px-2 py-1.5">
        <span className="text-sm">{line.startsWith("➡️") ? "➡️" : "→"}</span>
        <span className="text-sm font-medium text-saffron-dark">
          {applyInline(line.replace(/^(➡️|→)\s*/, ""))}
        </span>
      </div>
    );
  }

  // Tip line "💡 ..."
  if (line.startsWith("💡")) {
    return (
      <div key={idx} className="mt-2 rounded-[var(--radius-sm)] border border-saffron/20 bg-saffron/5 px-3 py-2 text-sm text-saffron-dark">
        {applyInline(line)}
      </div>
    );
  }

  // Empty line → spacer
  if (line.trim() === "") {
    return <div key={idx} className="h-1" />;
  }

  // Default paragraph
  return (
    <p key={idx} className="text-sm leading-relaxed">
      {applyInline(line)}
    </p>
  );
}

/** Apply inline formatting: **bold**, _italic_, `code` */
function applyInline(text: string): React.ReactNode {
  // Split on bold (**...**), italic (_..._), backtick code
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-navy">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return <em key={i} className="italic text-text-secondary">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-paper px-1 py-0.5 font-mono text-xs text-saffron-dark">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/** Render full markdown content for an agent message. */
function AgentContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return <div className="space-y-0.5">{lines.map((line, i) => renderLine(line, i))}</div>;
}

/** Single chat message bubble with avatar. */
export function ChatBubble({ role, content, agent, index = 0, isLatest = false }: ChatBubbleProps) {
  const isUser = role === "user";

  // For long messages (>400 chars), skip character animation — just show instantly
  // or use a fast word-reveal. This prevents 20-second waits on step walkthroughs.
  const skipAnimation = content.length > 400;

  const [displayedText, setDisplayedText] = useState(
    !isLatest || isUser || skipAnimation ? content : ""
  );

  useEffect(() => {
    if (!isLatest || isUser || skipAnimation) {
      setDisplayedText(content);
      return;
    }
    setDisplayedText("");
    let i = 0;
    // 8ms per char for short messages — snappy but readable
    const interval = setInterval(() => {
      i += 2; // advance 2 chars at a time for speed
      setDisplayedText(content.slice(0, i));
      if (i >= content.length) clearInterval(interval);
    }, 8);
    return () => clearInterval(interval);
  }, [content, isLatest, isUser, skipAnimation]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      role="article"
      aria-label={
        isUser
          ? "Your message"
          : `${agent ? (agentLabels[agent] || agent) : "Agent"} response`
      }
    >
      <Avatar type={isUser ? "user" : "agent"} size="sm" className="mt-1 shrink-0" />

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-navy text-white rounded-br-md"
            : "bg-surface border border-paper-dark text-text-primary shadow-card rounded-bl-md"
        )}
      >
        {!isUser && agent && agentLabels[agent] && (
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-saffron">
            {agentLabels[agent]}
          </div>
        )}

        {isUser ? (
          <p className="text-sm leading-relaxed">{displayedText}</p>
        ) : (
          <AgentContent text={displayedText} />
        )}
      </div>
    </motion.div>
  );
}
