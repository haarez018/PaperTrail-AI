"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  MapPin,
  AlertTriangle,
  Download,
  Clock,
  Building2,
  MessageSquare,
  Shield,
  CheckSquare,
  IndianRupee,
} from "lucide-react";
import { Button, Card, CardContent, LoadingSpinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  generateDocument,
  getNavigation,
  generateEscalation,
  DocumentResult,
  NavigationResult,
  EscalationResult,
} from "@/lib/api";

interface ProcedureDetailProps {
  procedureId: string;
  caseId: string | null;
  onClose: () => void;
}

type Tab = "documents" | "navigate" | "escalate";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "documents", label: "Generate Form", icon: FileText },
  { key: "navigate", label: "Navigate", icon: MapPin },
  { key: "escalate", label: "Escalate", icon: AlertTriangle },
];

export default function ProcedureDetail({
  procedureId,
  caseId,
  onClose,
}: ProcedureDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("documents");
  const [docResult, setDocResult] = useState<DocumentResult | null>(null);
  const [navResult, setNavResult] = useState<NavigationResult | null>(null);
  const [escResult, setEscResult] = useState<EscalationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const procName = procedureId
    .replace(/^tn_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const [error, setError] = useState<string | null>(null);

  const handleGenerateDoc = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDocument(procedureId, caseId || undefined);
      setDocResult(result);
    } catch {
      setError("That took longer than expected. Let me try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetNavigation = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNavigation(procedureId);
      setNavResult(result);
    } catch {
      setError("I'm having trouble finding office details right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateEscalation(procedureId, "rti", caseId || undefined);
      setEscResult(result);
    } catch {
      setError("Couldn't generate the escalation letter. Let me try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (base64: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `data:application/pdf;base64,${base64}`;
    link.download = filename;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-paper-dark bg-ivory p-6"
    >
      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg text-navy">{procName}</h3>
        <button
          onClick={onClose}
          className="rounded-[var(--radius-sm)] p-1.5 text-text-muted hover:bg-paper hover:text-navy transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-5 flex gap-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === "documents" && !docResult) handleGenerateDoc();
              if (key === "navigate" && !navResult) handleGetNavigation();
              if (key === "escalate" && !escResult) handleEscalate();
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition-all duration-[var(--duration-fast)]",
              activeTab === key
                ? "bg-saffron text-white shadow-sm"
                : "border border-paper-dark bg-surface text-text-secondary hover:border-saffron/40 hover:text-saffron-dark"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="lg" label="Loading..." />
        </div>
      )}

      {/* ── Error State ── */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="animate-wobble rounded-[var(--radius-md)] border border-danger/20 bg-red-50/50 px-4 py-6 text-center"
        >
          <AlertTriangle size={24} className="mx-auto text-danger/60" />
          <p className="mt-2 text-sm text-text-secondary">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              if (activeTab === "documents") handleGenerateDoc();
              else if (activeTab === "navigate") handleGetNavigation();
              else handleEscalate();
            }}
          >
            Try Again
          </Button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Documents Tab ── */}
        {activeTab === "documents" && docResult && !loading && (
          <motion.div
            key="docs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Card>
              <CardContent>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-navy">{docResult.procedure_name}</h4>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => downloadPdf(docResult.pdf_base64, `${procedureId}.pdf`)}
                  >
                    <Download size={14} /> Download PDF
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <IndianRupee size={12} /> Fee: Rs. {docResult.fee_inr}
                  </span>
                  <span>Size: {Math.round(docResult.pdf_size_bytes / 1024)}KB</span>
                </div>

                <div className="mt-4">
                  <h5 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy">
                    <CheckSquare size={14} className="text-saffron" />
                    Documents Checklist
                  </h5>
                  <ul className="space-y-1.5">
                    {docResult.checklist?.map((item, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-paper-dark text-saffron focus:ring-saffron/30"
                        />
                        <span className={item.mandatory ? "text-text-primary" : "text-text-secondary"}>
                          {item.name}
                          {item.mandatory && (
                            <span className="ml-1 text-xs font-medium text-danger">*required</span>
                          )}
                          {item.where_to_get && (
                            <span className="ml-1 text-xs text-text-muted">
                              (from: {item.where_to_get})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Navigate Tab ── */}
        {activeTab === "navigate" && navResult && !loading && (
          <motion.div
            key="nav"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Card>
              <CardContent>
                <h4 className="flex items-center gap-2 font-semibold text-navy">
                  <Building2 size={16} className="text-saffron" />
                  {navResult.office?.name}
                </h4>
                <p className="mt-1 text-sm text-text-secondary">{navResult.office?.address}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-[var(--radius-sm)] bg-paper p-2">
                    <span className="text-xs text-text-muted">Counter</span>
                    <p className="font-medium text-navy">{navResult.office?.counter}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-paper p-2">
                    <span className="text-xs text-text-muted">Hours</span>
                    <p className="font-medium text-navy">{navResult.office?.hours}</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-paper p-2">
                    <span className="text-xs text-text-muted">Avg wait</span>
                    <p className="font-medium text-navy">{navResult.average_wait_minutes} min</p>
                  </div>
                  <div className="rounded-[var(--radius-sm)] bg-paper p-2">
                    <span className="text-xs text-text-muted">Best time</span>
                    <p className="font-medium text-navy">{navResult.best_time_to_visit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h5 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy">
                  <MessageSquare size={14} className="text-saffron" />
                  What to say
                </h5>
                <p className="text-sm italic text-text-secondary">{navResult.what_to_say}</p>
              </CardContent>
            </Card>

            {navResult.if_they_ask_X_say_Y?.length > 0 && (
              <Card className="border-saffron/30 bg-saffron-light/30">
                <CardContent>
                  <h5 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-saffron-dark">
                    <Shield size={14} />
                    Pro Tips (if they push back)
                  </h5>
                  <div className="space-y-3">
                    {navResult.if_they_ask_X_say_Y.map((tip, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="text-text-secondary">
                          <strong className="text-navy">If asked:</strong> &ldquo;{tip.if_asked}&rdquo;
                        </p>
                        <p className="mt-0.5 text-saffron-dark">
                          <strong>Say:</strong> &ldquo;{tip.say}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* ── Escalate Tab ── */}
        {activeTab === "escalate" && escResult && !loading && (
          <motion.div
            key="esc"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <Card className="border-danger/20 bg-red-50/50">
              <CardContent>
                <h4 className="flex items-center gap-2 font-semibold text-danger">
                  <AlertTriangle size={16} />
                  RTI Application Ready
                </h4>
                <p className="mt-1.5 text-sm text-text-secondary">
                  If this procedure stalls beyond the stipulated time, use this
                  pre-drafted RTI application to legally compel a response.
                </p>

                <div className="mt-4">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => downloadPdf(escResult.pdf_base64, `${procedureId}_rti.pdf`)}
                  >
                    <Download size={14} /> Download RTI PDF
                  </Button>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-danger/80">
                  <p>
                    <strong>Legal basis:</strong>{" "}
                    {escResult.letter?.legal_citations?.join(", ")}
                  </p>
                  <p>
                    <strong>Expected response:</strong>{" "}
                    {escResult.letter?.expected_response_days} days
                  </p>
                  <p className="flex items-center gap-1">
                    <strong>Fee:</strong>
                    <IndianRupee size={12} />
                    {escResult.letter?.fee_inr}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <h5 className="mb-2 text-sm font-semibold text-navy">How to submit:</h5>
                <ul className="space-y-1.5">
                  {escResult.letter?.submission_methods?.map(
                    (method: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-saffron" />
                        {method}
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {/* ── Empty States ── */}
        {!loading && !error && activeTab === "documents" && !docResult && (
          <motion.div
            key="empty-doc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <FileText size={28} className="mx-auto text-text-muted/40" />
            <p className="mt-2 text-sm text-text-secondary">
              Once your plan is ready, we&apos;ll auto-generate your forms.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleGenerateDoc}>
              Generate Now
            </Button>
          </motion.div>
        )}

        {!loading && !error && activeTab === "navigate" && !navResult && (
          <motion.div
            key="empty-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <MapPin size={28} className="mx-auto text-text-muted/40" />
            <p className="mt-2 text-sm text-text-secondary">
              We&apos;re finding the nearest office and best time to visit.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleGetNavigation}>
              Find Office
            </Button>
          </motion.div>
        )}

        {!loading && !error && activeTab === "escalate" && !escResult && (
          <motion.div
            key="empty-esc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-8 text-center"
          >
            <AlertTriangle size={28} className="mx-auto text-text-muted/40" />
            <p className="mt-2 text-sm text-text-secondary">
              Everything is on track. We&apos;ll alert you if anything stalls.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
