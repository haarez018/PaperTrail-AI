"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { isSpeechSupported, createSpeechSession } from "@/lib/speech";
import { Tooltip } from "@/components/ui";

interface VoiceInputProps {
  language: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "error";

const langLabel: Record<string, string> = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
};

/**
 * Microphone button that uses the Web Speech API to transcribe speech
 * and fill the chat input. Language auto-follows the LanguageToggle.
 * Shows a pulsing saffron waveform overlay while recording.
 */
export function VoiceInput({ language, onTranscript, disabled }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sessionRef = useRef<{ start: () => void; stop: () => void } | null>(null);

  const supported = isSpeechSupported();

  const handleToggle = useCallback(() => {
    if (!supported) return;

    if (state === "recording") {
      sessionRef.current?.stop();
      return;
    }

    setErrorMsg(null);
    const session = createSpeechSession({
      language,
      onStart: () => setState("recording"),
      onResult: (text) => {
        onTranscript(text);
        setState("idle");
      },
      onError: (msg) => {
        setErrorMsg(msg);
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      },
      onEnd: () => setState("idle"),
    });
    sessionRef.current = session;
    session.start();
  }, [state, language, onTranscript, supported]);

  if (!supported) {
    return (
      <Tooltip
        content="Voice input works best in Chrome or Edge"
        side="top"
      >
        <button
          disabled
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-text-muted opacity-40 cursor-not-allowed"
          aria-label="Voice input not supported"
        >
          <MicOff size={18} />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="relative">
      {/* Pulsing ring while recording */}
      <AnimatePresence>
        {state === "recording" && (
          <motion.span
            key="pulse"
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-[var(--radius-md)] bg-saffron pointer-events-none"
          />
        )}
      </AnimatePresence>

      <button
        onClick={handleToggle}
        disabled={disabled}
        aria-label={
          state === "recording"
            ? `Stop recording — listening in ${langLabel[language] ?? "English"}`
            : `Start voice input in ${langLabel[language] ?? "English"}`
        }
        aria-pressed={state === "recording"}
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] transition-all duration-[var(--duration-base)]",
          state === "recording"
            ? "bg-saffron text-white shadow-card-hover"
            : state === "error"
            ? "bg-danger/10 text-danger"
            : "text-text-muted hover:bg-paper hover:text-navy",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
      >
        {state === "error" ? (
          <AlertCircle size={18} />
        ) : state === "recording" ? (
          <Mic size={18} className="animate-pulse" />
        ) : (
          <Mic size={18} />
        )}
      </button>

      {/* Listening label */}
      <AnimatePresence>
        {state === "recording" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-saffron px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
          >
            Listening in {langLabel[language] ?? "English"}…
          </motion.div>
        )}
        {state === "error" && errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-danger px-2.5 py-1 text-[10px] text-white shadow-sm max-w-[200px] text-center"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
