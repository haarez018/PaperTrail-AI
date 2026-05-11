"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui";
import { ExtractedFields } from "./ExtractedFields";

interface DocumentScannerProps {
  onFieldsConfirmed: (summary: string) => void;
  disabled?: boolean;
}

type ScanState = "idle" | "processing" | "result" | "error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Camera/file-upload button that runs OCR on government documents
 * and presents extracted fields as editable chips.
 * On mobile: opens camera directly. On desktop: file picker.
 */
export function DocumentScanner({ onFieldsConfirmed, disabled }: DocumentScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{
    fields: Record<string, string>;
    confidence: number;
    documentType: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setState("processing");
    setErrorMsg(null);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Send to OCR endpoint
      const res = await fetch(`${API_URL}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: base64,
          document_type_hint: "auto",
        }),
      });

      if (!res.ok) throw new Error(`OCR failed: ${res.status}`);

      const data = await res.json();
      setExtractedData({
        fields: data.extracted_fields ?? {},
        confidence: data.confidence ?? 0,
        documentType: data.document_type_detected ?? "unknown",
      });
      setState("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Scan failed");
      // Show result with empty fields so user sees the "no fields" message
      setExtractedData({ fields: {}, confidence: 0, documentType: "unknown" });
      setState("result");
    } finally {
      // Reset file input
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleConfirm = (_fields: Record<string, string>, summary: string) => {
    onFieldsConfirmed(summary);
    handleDismiss();
  };

  const handleDismiss = () => {
    setState("idle");
    setPreviewUrl(null);
    setExtractedData(null);
    setErrorMsg(null);
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload document image for scanning"
      />

      {/* Trigger button */}
      <Tooltip
        content="Scan a government document (Aadhaar, death certificate, etc.) to auto-fill details"
        side="top"
      >
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled || state === "processing"}
          aria-label="Scan document"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] transition-all duration-[var(--duration-base)]",
            state === "processing"
              ? "text-saffron"
              : "text-text-muted hover:bg-paper hover:text-navy",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {state === "processing" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Camera size={18} />
          )}
        </button>
      </Tooltip>

      {/* Result overlay — rendered in the chat area via a portal-style approach */}
      <AnimatePresence>
        {(state === "result") && extractedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute bottom-14 left-0 w-[380px] z-50 shadow-card-hover"
          >
            {/* Image thumbnail */}
            {previewUrl && (
              <div className="relative mb-2 overflow-hidden rounded-[var(--radius-md)] border border-paper-dark bg-surface">
                <img
                  src={previewUrl}
                  alt="Scanned document"
                  className="h-28 w-full object-cover"
                />
                <button
                  onClick={handleDismiss}
                  className="absolute right-2 top-2 rounded-full bg-navy/60 p-1 text-white hover:bg-navy"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-1 left-2 rounded-sm bg-navy/70 px-1.5 py-0.5 text-[10px] text-white">
                  Scanned
                </div>
              </div>
            )}

            <ExtractedFields
              fields={extractedData.fields}
              confidence={extractedData.confidence}
              documentType={extractedData.documentType}
              onConfirm={handleConfirm}
              onDismiss={handleDismiss}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip data URL prefix: "data:image/jpeg;base64,..."
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
