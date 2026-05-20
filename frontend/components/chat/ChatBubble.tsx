"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { AnnotatedText } from "@/components/Term";

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

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

const agentLabels: Record<string, string> = {
  intake: "Intake Agent",
  planner: "Planning Agent",
  document: "Document Agent",
  navigation: "Navigation Agent",
  escalation: "Escalation Agent",
  done: "PaperTrail AI",
};

/** Single chat message bubble with avatar. */
export function ChatBubble({ role, content, agent, index = 0, isLatest = false }: ChatBubbleProps) {
  const isUser = role === "user";

  // Typing animation — character by character, latest agent message only
  const [displayedText, setDisplayedText] = useState(
    isLatest && !isUser ? "" : content
  );

  useEffect(() => {
    if (!isLatest || isUser) {
      setDisplayedText(content);
      return;
    }
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(content.slice(0, i));
      if (i >= content.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [content, isLatest, isUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      role="article"
      aria-label={isUser ? "Your message" : `${agent ? (agentLabels[agent] || agent) : "Agent"} response`}
    >
      <Avatar type={isUser ? "user" : "agent"} size="sm" className="mt-1" />

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-navy text-white rounded-br-md"
            : "bg-surface border border-paper-dark text-text-primary shadow-card rounded-bl-md"
        )}
      >
        {!isUser && agent && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-saffron">
            {agentLabels[agent] || agent}
          </div>
        )}
        {isUser ? (
          <div
            className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(displayedText) }}
          />
        ) : (
          <div className="text-sm leading-relaxed">
            {displayedText.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                <AnnotatedText text={line} />
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
