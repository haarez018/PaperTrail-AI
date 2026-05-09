"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss after this many milliseconds. 0 = sticky. */
  duration?: number;
  onDismiss: (id: string) => void;
}

const variantConfig: Record<
  ToastVariant,
  { icon: React.ElementType; containerClass: string }
> = {
  success: {
    icon: CheckCircle2,
    containerClass: "border-success/30 bg-green-50 text-success",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "border-warning/30 bg-orange-50 text-warning",
  },
  error: {
    icon: AlertCircle,
    containerClass: "border-danger/30 bg-red-50 text-danger",
  },
  info: {
    icon: Info,
    containerClass: "border-info/30 bg-blue-50 text-info",
  },
};

/** Single toast notification. */
export function Toast({
  id,
  message,
  variant = "info",
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const dismiss = useCallback(() => onDismiss(id), [id, onDismiss]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(dismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, dismiss]);

  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 shadow-card",
        cfg.containerClass
      )}
      role="alert"
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={dismiss}
        className="shrink-0 rounded-[var(--radius-sm)] p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

/** Container that renders a stack of toasts in the top-right corner. */
export interface ToastContainerProps {
  toasts: (Omit<ToastProps, "onDismiss"> & { variant?: ToastVariant })[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
