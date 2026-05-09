"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/** Message input textarea with warm border and saffron focus ring. */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-[var(--radius-md)] border border-paper-dark bg-white px-4 py-3 text-base text-text-primary placeholder:text-text-muted resize-none",
        "transition-all duration-[var(--duration-fast)]",
        "focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
TextArea.displayName = "TextArea";

export { TextArea };
