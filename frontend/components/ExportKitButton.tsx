"use client";

import { useState } from "react";
import { Download, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/cn";

interface ExportKitButtonProps {
  caseId: string;
  className?: string;
}

type ExportState = "idle" | "loading" | "success" | "error";

/**
 * Downloads the complete print-ready PDF kit for a case.
 * Calls POST /api/case/{id}/export-kit, decodes the base64 PDF,
 * and triggers a browser download.
 */
export function ExportKitButton({ caseId, className }: ExportKitButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async () => {
    if (state === "loading") return;
    setState("loading");
    setErrorMsg(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/case/${caseId}/export-kit`,
        { method: "POST" }
      );

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      // Decode base64 → Blob → download
      const binary = atob(data.pdf_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `nyayamitra-kit-${caseId.slice(0, 8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState("success");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Export failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const content = {
    idle: (
      <>
        <Download size={16} />
        Download Complete Kit
      </>
    ),
    loading: (
      <>
        <Loader2 size={16} className="animate-spin" />
        Generating PDF…
      </>
    ),
    success: (
      <>
        <CheckCircle size={16} />
        Kit Downloaded!
      </>
    ),
    error: (
      <>
        <AlertCircle size={16} />
        {errorMsg ?? "Export failed"}
      </>
    ),
  };

  return (
    <Tooltip
      content={
        state === "idle"
          ? "Downloads all forms, checklists, office schedule & legal references as a single PDF"
          : state === "loading"
          ? "Building your kit — this may take a few seconds"
          : state === "success"
          ? "Your kit has been saved"
          : errorMsg ?? "Something went wrong"
      }
      side="top"
    >
      <Button
        variant={state === "error" ? "danger" : state === "success" ? "secondary" : "primary"}
        size="sm"
        onClick={handleExport}
        disabled={state === "loading"}
        className={cn(
          "inline-flex items-center gap-2 transition-all",
          state === "success" && "bg-success text-white border-success",
          className
        )}
        aria-label="Download complete procedure kit as PDF"
      >
        {content[state]}
      </Button>
    </Tooltip>
  );
}
