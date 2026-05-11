"use client";

import { useState } from "react";
import { Download, FileText, CheckCircle, AlertCircle, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui";
import { Tooltip } from "@/components/ui";
import { PdfViewer } from "@/components/PdfViewer";
import { cn } from "@/lib/cn";

interface ExportKitButtonProps {
  caseId: string;
  className?: string;
}

type ExportState = "idle" | "loading" | "success" | "error";

/**
 * Downloads (and optionally previews in-app) the complete print-ready
 * PDF kit for a case. POST /api/case/{id}/export-kit → base64 PDF.
 */
export function ExportKitButton({ caseId, className }: ExportKitButtonProps) {
  const [state, setState] = useState<ExportState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const fetchKit = async (): Promise<string | null> => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/case/${caseId}/export-kit`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    return data.pdf_base64 as string;
  };

  const handleDownload = async () => {
    if (state === "loading") return;
    setState("loading");
    setErrorMsg(null);

    try {
      const b64 = pdfBase64 ?? await fetchKit();
      if (!b64) throw new Error("No PDF data returned");
      setPdfBase64(b64);

      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
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

  const handlePreview = async () => {
    if (pdfBase64) {
      setViewerOpen(true);
      return;
    }
    setState("loading");
    try {
      const b64 = await fetchKit();
      if (!b64) throw new Error("No PDF data returned");
      setPdfBase64(b64);
      setState("success");
      setTimeout(() => setState("idle"), 2000);
      setViewerOpen(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Load failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  const downloadLabel = {
    idle: <><Download size={14} /> Download Kit</>,
    loading: <><Loader2 size={14} className="animate-spin" /> Generating…</>,
    success: <><CheckCircle size={14} /> Downloaded!</>,
    error: <><AlertCircle size={14} /> {errorMsg ?? "Failed"}</>,
  };

  return (
    <>
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        {/* Preview button */}
        <Tooltip content="Preview document kit in-app before printing" side="top">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreview}
            disabled={state === "loading"}
            data-export-kit
            aria-label="Preview document kit"
            className="inline-flex items-center gap-1.5"
          >
            {state === "loading" && !pdfBase64
              ? <Loader2 size={14} className="animate-spin" />
              : <Eye size={14} />}
            Preview
          </Button>
        </Tooltip>

        {/* Download button */}
        <Tooltip
          content={
            state === "idle" ? "Download all forms, checklist & legal references as PDF"
            : state === "loading" ? "Generating your kit…"
            : state === "success" ? "Kit saved to Downloads"
            : errorMsg ?? "Something went wrong"
          }
          side="top"
        >
          <Button
            variant={state === "error" ? "danger" : state === "success" ? "secondary" : "primary"}
            size="sm"
            onClick={handleDownload}
            disabled={state === "loading"}
            aria-label="Download complete procedure kit as PDF"
            className={cn(
              "inline-flex items-center gap-1.5 transition-all",
              state === "success" && "bg-success text-white border-success"
            )}
          >
            {downloadLabel[state]}
          </Button>
        </Tooltip>
      </div>

      {/* In-app PDF viewer */}
      {pdfBase64 && (
        <PdfViewer
          src={pdfBase64}
          title={`NyayaMitra Kit — Case ${caseId.slice(0, 8).toUpperCase()}`}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          downloadFilename={`nyayamitra-kit-${caseId.slice(0, 8).toUpperCase()}.pdf`}
        />
      )}
    </>
  );
}
