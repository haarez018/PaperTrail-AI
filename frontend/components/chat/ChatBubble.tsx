"use client";

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
  done: "NyayaMitra",
};

/** Single chat message bubble with avatar. */
export function ChatBubble({ role, content, agent, index = 0 }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar type={isUser ? "user" : "agent"} size="sm" className="mt-1" />

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-navy text-white rounded-br-md"
            : "bg-white border border-paper-dark text-text-primary shadow-card rounded-bl-md"
        )}
      >
        {!isUser && agent && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-saffron">
            {agentLabels[agent] || agent}
          </div>
        )}
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
        />
      </div>
    </motion.div>
  );
}
