"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback section label shown in the error UI. */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — catches render errors in child components and
 * displays a human-friendly recovery UI instead of crashing the page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
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

    return this.props.children;
  }
}
