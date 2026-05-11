"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface PdfViewerProps {
  /** base64-encoded PDF string, or a blob URL, or a regular URL */
  src: string;
  /** Display name shown in header */
  title?: string;
  open: boolean;
  onClose: () => void;
  /** Optional filename for the download button */
  downloadFilename?: string;
}

/**
 * Full-screen modal PDF viewer using an <iframe>.
 * Accepts base64 PDF data (converts to blob URL internally),
 * direct blob:// URLs, or regular https:// URLs.
 */
export function PdfViewer({
  src,
  title = "Document",
  open,
  onClose,
  downloadFilename = "nyayamitra-document.pdf",
}: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(100);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevBlobUrl = useRef<string | null>(null);

  /* Convert base64 → blob URL when src changes */
  useEffect(() => {
    if (!open || !src) return;

    // Revoke previous blob URL to avoid memory leaks
    if (prevBlobUrl.current) {
      URL.revokeObjectURL(prevBlobUrl.current);
      prevBlobUrl.current = null;
    }

    setLoading(true);
    setError(false);

    if (src.startsWith("blob:") || src.startsWith("http")) {
      setBlobUrl(src);
      return;
    }

    // Assume base64 PDF
    try {
      const binary = atob(src);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      prevBlobUrl.current = url;
      setBlobUrl(url);
    } catch {
      setError(true);
      setLoading(false);
    }
  }, [src, open]);

  /* Revoke on unmount */
  useEffect(() => {
    return () => {
      if (prevBlobUrl.current) URL.revokeObjectURL(prevBlobUrl.current);
    };
  }, []);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = downloadFilename;
    a.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pdf-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] bg-navy/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="pdf-modal"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 16 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              "fixed inset-[2vh_2vw] z-[120]",
              "flex flex-col overflow-hidden",
              "rounded-[var(--radius-xl)] border border-paper-dark bg-surface shadow-2xl"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3 border-b border-paper-dark bg-paper px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={15} className="shrink-0 text-saffron" />
                <span className="truncate font-medium text-sm text-navy">{title}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Zoom controls */}
                <button
                  onClick={() => setZoom((z) => Math.max(50, z - 20))}
                  disabled={zoom <= 50}
                  className="rounded p-1.5 text-text-muted hover:bg-paper-dark hover:text-navy disabled:opacity-40 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="w-12 text-center text-xs text-text-muted tabular-nums">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(200, z + 20))}
                  disabled={zoom >= 200}
                  className="rounded p-1.5 text-text-muted hover:bg-paper-dark hover:text-navy disabled:opacity-40 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>

                <div className="mx-1 h-4 w-px bg-paper-dark" />

                {/* Full screen (open in new tab) */}
                {blobUrl && (
                  <a
                    href={blobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 text-text-muted hover:bg-paper-dark hover:text-navy transition-colors"
                    title="Open in new tab"
                  >
                    <Maximize2 size={14} />
                  </a>
                )}

                {/* Download */}
                <button
                  onClick={handleDownload}
                  disabled={!blobUrl}
                  className="rounded p-1.5 text-text-muted hover:bg-paper-dark hover:text-navy disabled:opacity-40 transition-colors"
                  title="Download PDF"
                >
                  <Download size={14} />
                </button>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="ml-1 rounded-full p-1.5 text-text-muted hover:bg-paper-dark hover:text-navy transition-colors"
                  title="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Content ── */}
            <div className="relative flex-1 overflow-hidden bg-[#525659]">
              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#525659] z-10">
                  <div className="flex flex-col items-center gap-3 text-white/70">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-sm">Loading PDF…</span>
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#525659]">
                  <div className="text-center text-white/70">
                    <FileText size={32} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Unable to preview this PDF.</p>
                    <button
                      onClick={handleDownload}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-saffron px-4 py-1.5 text-sm font-medium text-white hover:bg-saffron-dark transition-colors"
                    >
                      <Download size={13} /> Download instead
                    </button>
                  </div>
                </div>
              )}

              {/* iframe */}
              {blobUrl && !error && (
                <iframe
                  ref={iframeRef}
                  src={blobUrl}
                  title={title}
                  onLoad={() => setLoading(false)}
                  onError={() => { setError(true); setLoading(false); }}
                  className="h-full w-full border-0"
                  style={{
                    transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                    transformOrigin: "top center",
                    width: zoom !== 100 ? `${10000 / zoom}%` : "100%",
                    height: zoom !== 100 ? `${10000 / zoom}%` : "100%",
                  }}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
