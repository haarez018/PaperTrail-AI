"use client";

import { useRef, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui";
import { VoiceInput } from "./VoiceInput";
import { DocumentScanner } from "./DocumentScanner";
import { cn } from "@/lib/cn";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isFirstMessage: boolean;
  /** Current language from LanguageToggle — controls voice recognition locale. */
  language?: string;
}

/** Chat text input with auto-resize, voice input, and send animation. */
export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  isFirstMessage,
  language = "en",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [animating, setAnimating] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onSend();
  };

  const handleTranscript = (text: string) => {
    onChange(value ? `${value} ${text}` : text);
    // Focus the textarea so user can review and edit
    textareaRef.current?.focus();
  };

  const handleScannedDocument = (summary: string) => {
    onChange(value ? `${value}\n${summary}` : summary);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-paper-dark bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-end gap-2">
        {/* Voice input mic */}
        <VoiceInput
          language={language}
          onTranscript={handleTranscript}
          disabled={isLoading}
        />

        {/* Document scanner */}
        <DocumentScanner
          onFieldsConfirmed={handleScannedDocument}
          disabled={isLoading}
        />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isFirstMessage
              ? "Tell me what happened… or tap the mic to speak"
              : "Type your response…"
          }
          rows={1}
          disabled={isLoading}
          className={cn(
            "flex-1 resize-none rounded-[var(--radius-md)] border border-paper-dark bg-ivory px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted",
            "transition-all duration-[var(--duration-fast)]",
            "focus:border-saffron focus:bg-surface focus:outline-none focus:ring-2 focus:ring-saffron/20",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />

        <Button
          variant="primary"
          size="icon"
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          aria-label="Send message"
          className="relative overflow-hidden"
        >
          <Send
            size={18}
            className={cn(
              "transition-transform",
              animating && "animate-fly-up"
            )}
          />
        </Button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-text-muted">
        Enter to send · Shift+Enter for new line · Mic to speak · Camera to scan docs
      </p>
    </div>
  );
}
