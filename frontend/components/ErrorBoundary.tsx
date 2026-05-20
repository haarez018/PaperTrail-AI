"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback section label shown in the error UI. */
  section?: string;
  /**
   * "chat"    — saffron card with "Your case is saved — refresh to continue."
   * "section" — (default) compact inline error for sidebar panels
   */
  variant?: "chat" | "section";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors in child components and
 * displays a human-friendly recovery UI instead of crashing the page.
 *
 * Always logs to console.error so errors surface in DevTools.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Always log — surfaces in browser DevTools and server logs
    console.error("[ErrorBoundary]", this.props.section ?? "app", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const variant = this.props.variant ?? "section";

    /* ── Chat variant: full-area saffron card ── */
    if (variant === "chat") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-saffron-light">
            <AlertCircle size={26} className="text-saffron-dark" />
          </div>
          <div className="max-w-sm space-y-1">
            <h3 className="font-display text-xl text-navy">
              Something went wrong
            </h3>
            <p className="text-sm text-text-secondary">
              Your case is saved — refresh to continue.
            </p>
          </div>
          <button
            onClick={this.handleRefresh}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-saffron px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-75"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      );
    }

    /* ── Section variant: compact inline error for sidebar panels ── */
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[var(--radius-md)] border border-danger/20 bg-red-50/30 px-6 py-10 text-center">
        <AlertCircle size={32} className="text-danger/50" />
        <div>
          <h3 className="font-display text-lg text-navy">
            Something went wrong
            {this.props.section ? ` in ${this.props.section}` : ""}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            Don&apos;t worry — your data is safe. Try refreshing this section.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={this.handleRetry}>
          <RefreshCw size={14} /> Try Again
        </Button>
      </div>
    );
  }
}
