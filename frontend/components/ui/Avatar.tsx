"use client";

import { User, Bot } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AvatarProps {
  type: "user" | "agent";
  /** Initials to display instead of the icon. */
  initials?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

const iconSizeMap = { sm: 14, md: 18, lg: 24 };

/** Chat avatar — saffron for the PaperTrail AI agent, navy for the user. */
export function Avatar({ type, initials, size = "md", className }: AvatarProps) {
  const isAgent = type === "agent";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        isAgent
          ? "bg-saffron-light text-saffron-dark"
          : "bg-navy/10 text-navy",
        sizeMap[size],
        className
      )}
      aria-label={isAgent ? "PaperTrail AI agent" : "You"}
    >
      {initials ? (
        initials.slice(0, 2).toUpperCase()
      ) : isAgent ? (
        <Bot size={iconSizeMap[size]} />
      ) : (
        <User size={iconSizeMap[size]} />
      )}
    </span>
  );
}
