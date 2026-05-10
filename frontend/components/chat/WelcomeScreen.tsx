"use client";

import { motion } from "framer-motion";
import { Scale, MessageCircle } from "lucide-react";

const promptSuggestions = [
  "My grandfather passed away in Chennai",
  "I need to change my name after marriage",
  "My widow pension was rejected twice",
  "I want to file an RTI about my ration card",
];

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

/** Empty-state hero shown before the first message. */
export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-saffron-light"
      >
        <Scale size={28} className="text-saffron-dark" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="mt-5"
      >
        <h2 className="font-display text-2xl text-navy">How can I help you today?</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          Tell me about your situation and I&apos;ll identify every government procedure
          you need, generate the forms, and guide you step by step.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.35 }}
        className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {promptSuggestions.map((prompt, idx) => (
          <button
            key={prompt}
            onClick={() => onSelectPrompt(prompt)}
            className="group flex items-start gap-2.5 rounded-[var(--radius-md)] border border-paper-dark bg-surface px-4 py-3 text-left text-sm text-text-secondary shadow-sm transition-all duration-[var(--duration-fast)] hover:border-saffron/40 hover:bg-saffron-light/40 hover:text-text-primary hover:shadow-card"
          >
            <MessageCircle
              size={14}
              className="mt-0.5 shrink-0 text-text-muted transition-colors group-hover:text-saffron"
            />
            <span>&ldquo;{prompt}&rdquo;</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
