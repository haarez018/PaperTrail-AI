"use client";

import { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  isFirstMessage: boolean;
}

/** Chat text input with auto-resize and send button. */
export function ChatInput({
  value,
  onChange,
  onSend,
  isLoading,
  isFirstMessage,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      onSend();
    }
  };

  return (
    <div className="border-t border-paper-dark bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isFirstMessage
              ? "Tell me what happened... (e.g., 'My grandfather passed away in Chennai')"
              : "Type your response..."
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
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          aria-label="Send message"
        >
          <Send size={18} />
        </Button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-text-muted">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
