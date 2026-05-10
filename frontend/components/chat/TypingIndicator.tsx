"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";

/** Bouncing dots that show while the agent is thinking. */
export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar type="agent" size="sm" className="mt-1" />
      <div className="rounded-2xl rounded-bl-md border border-paper-dark bg-surface px-4 py-3 shadow-card">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-saffron"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
