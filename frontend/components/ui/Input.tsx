"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/** Text input with warm border and saffron focus ring. */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-[var(--radius-md)] border border-paper-dark bg-surface px-4 py-2 text-base text-text-primary placeholder:text-text-muted",
        "transition-all duration-[var(--duration-fast)]",
        "focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
