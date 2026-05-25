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
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import { Button, Card, CardContent, LoadingSpinner } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/lib/store";
import {
  generateDocument,
  getNavigation,
  generateEscalation,
  DocumentResult,
  NavigationResult,
  EscalationResult,
} from "@/lib/api";
import { RejectionScanner } from "@/components/RejectionScanner";
import { LegalPrecedents } from "@/components/LegalPrecedents";
import { CostComparison } from "@/components/CostComparison";

interface ProcedureDetailProps {
  procedureId: string;
  caseId: string | null;
  onClose: () => void;
}

type Tab = "documents" | "navigate" | "escalate";

const tabs: { key: Tab; label: string; shortLabel: string; icon: React.ElementType }[] = [
  { key: "documents", label: "Generate Form", shortLabel: "Form", icon: FileText },
  { key: "navigate",  label: "Navigate",      shortLabel: "Visit", icon: MapPin },
  { key: "escalate",  label: "Escalate",      shortLabel: "RTI",   icon: AlertTriangle },
];

const downloadText = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const OFFICE_TIPS: Record<string, string[]> = {
  corporation: [
    "Best days: Tuesday or Wednesday — Mondays are crowded after the weekend",
    "Arrive by 9:30 AM to get a morning token — afternoon queues are 2× longer",
    "Bring more photocopies than required — they often ask for 3 copies",
    "Parking is limited near Ripon Building — take public transport if possible",
    "Token system: after getting token, you can step out briefly and return",
  ],
  tahsildar: [
    "Affidavit must be on Rs.20 stamp paper — buy at the District Court complex nearby",
    "Submitted Mon–Wed → typically ready by Friday of same week",
    "Submitted Thu–Fri → typically ready following Wednesday",
    "Bring original documents + 2 full sets of photocopies",
    "Ask to speak to the Tahsildar directly if counter staff are unhelpful",
  ],
  bank: [
    "Visit the specific branch where the account was held — not just any branch",
    "Bring all legal heirs in person if possible — or notarized consent letters",
    "Bank Manager has discretion — politely request to speak with them",
    "Best time: 10–11 AM, not month-end (salary processing makes banks busy)",
    "Some banks require a formal 'Stop Payment' request submitted first",
  ],
  treasury: [
    "Bring a cancelled cheque from the nominee's bank account",
    "Pension order number (found on old pension slips) speeds up processing",
    "Ask for acknowledgement receipt — track processing by calling after 15 days",
  ],
  default: [
    "Morning visits (before 11 AM) are consistently faster across all government offices",
    "Bring more photocopies than you think you need — 3 sets of everything",
    "Always ask for an acknowledgement receipt with date and reference number",
    "Officer name on receipt matters — helps with RTI if there's a delay",
    "If told 'come back tomorrow', ask for a specific date in writing",
  ],
};

function getOfficeTips(officeName?: string): string[] {
  const name = (officeName || "").toLowerCase();
  if (name.includes("corporation") || name.includes("municipal")) return OFFICE_TIPS.corporation;
  if (name.includes("tahsildar") || name.includes("revenue")) return OFFICE_TIPS.tahsildar;
  if (name.includes("bank")) return OFFICE_TIPS.bank;
  if (name.includes("treasury") || name.includes("pension")) return OFFICE_TIPS.treasury;
  return OFFICE_TIPS.default;
}

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

  // Documents tab — rejection scanner modal
  const [showScanner, setShowScanner] = useState(false);

  // Documents tab — submit flow
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [receiptRef, setReceiptRef] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Escalate tab — RTI chain
  const [showFirstAppeal, setShowFirstAppeal] = useState(false);
  const [showSecondAppeal, setShowSecondAppeal] = useState(false);

  // Navigate tab — Office Intelligence
  const [tipsOpen, setTipsOpen] = useState(false);

  const markSubmitted = useAppStore((s) => s.markSubmitted);

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

  // Deadline date: 21 days from now
  const deadlineDate = new Date(Date.now() + 21 * 86400000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // RTI letter dates
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const firstAppealText = `To: The First Appellate Authority
   [Department/Office that received your RTI]
Subject: First Appeal under Section 19(1) of RTI Act 2005

My RTI application dated ${thirtyDaysAgo} was not responded to within the
mandatory 30-day period under Section 7(1) of the Right to Information Act 2005.

I hereby file this First Appeal requesting:
1. The information sought in my original RTI application
2. Reason for delay / non-response

I request you to provide the information within 15 days under Section 19(1) RTI Act.

Yours faithfully,
[Your Name]
Date: ${today}`;

  const secondAppealText = `To: The Central Information Commissioner
    Central Information Commission, New Delhi - 110003

Under Section 19(3) of the RTI Act 2005, I file this Second Appeal
as my First Appeal dated ${today} has not been responded to.

Attachments required:
• Copy of original RTI application
• Copy of First Appeal
• Proof of postage/acknowledgement

Submit online: https://cic.gov.in
Fee: None for second appeal

Yours faithfully,
[Your Name]
Date: ${today}`;

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
        {tabs.map(({ key, label, shortLabel, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === "documents" && !docResult) handleGenerateDoc();
              if (key === "navigate" && !navResult) handleGetNavigation();
              if (key === "escalate" && !escResult) handleEscalate();
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-2 text-xs font-medium transition-all duration-[var(--duration-fast)] sm:px-3.5 sm:text-sm",
              activeTab === key
                ? "bg-saffron text-white shadow-sm"
                : "border border-paper-dark bg-surface text-text-secondary hover:border-saffron/40 hover:text-saffron-dark"
            )}
            title={label}
          >
            <Icon size={13} />
            {/* Full label on sm+, short label on mobile */}
            <span className="hidden xs:inline">{label}</span>
            <span className="xs:hidden">{shortLabel}</span>
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

                {/* ── Mark as Submitted flow ── */}
                <div className="mt-4">
                  {!submitted && !showSubmitForm && (
                    <button
                      onClick={() => setShowSubmitForm(true)}
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-navy/30 px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5 transition-colors"
                    >
                      ✓ Mark as Submitted
                    </button>
                  )}

                  {showSubmitForm && !submitted && (
                    <div className="rounded-[var(--radius-md)] border border-paper-dark bg-paper p-4 space-y-3">
                      <label className="block text-sm font-medium text-navy">
                        Receipt reference number (optional):
                      </label>
                      <input
                        type="text"
                        value={receiptRef}
                        onChange={(e) => setReceiptRef(e.target.value)}
                        placeholder="e.g. TN/2024/123456"
                        className="w-full rounded-[var(--radius-sm)] border border-paper-dark bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-navy/40 focus:outline-none focus:ring-1 focus:ring-navy/20"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            markSubmitted(procedureId, 21, receiptRef);
                            setSubmitted(true);
                            setShowSubmitForm(false);
                          }}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSubmitForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {submitted && (
                    <div className="rounded-[var(--radius-md)] border border-saffron/30 bg-saffron-light/30 p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-saffron-dark">
                        <Clock size={14} />
                        Submitted! Deadline: {deadlineDate}
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">
                        We&apos;ll flag this case if there&apos;s no response by then.
                      </p>
                    </div>
                  )}
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

                  <button
                    onClick={() => setShowScanner(true)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-saffron/40 bg-saffron-light/30 px-3 py-1.5 text-sm font-medium text-saffron-dark hover:bg-saffron-light/60 transition-colors"
                  >
                    Pre-check Documents →
                  </button>
                </div>
              </CardContent>
            </Card>

            {showScanner && (
              <RejectionScanner
                procedureId={procedureId}
                procedureName={procName}
                onClose={() => setShowScanner(false)}
              />
            )}
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
                {navResult.office?.address && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((navResult.office.address || '') + ', Tamil Nadu')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      🗺️ Google Maps
                    </a>
                    <a
                      href={`maps:?q=${encodeURIComponent(navResult.office.address || '')}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      🍎 Apple Maps
                    </a>
                  </div>
                )}
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

            <div className="rounded-[var(--radius-md)] border border-paper-dark bg-surface">
              <button
                className="flex w-full items-center justify-between p-3 text-sm font-semibold text-navy"
                onClick={() => setTipsOpen(!tipsOpen)}
              >
                <span>🧠 Office Intelligence</span>
                <ChevronDown size={14} className={`transition-transform ${tipsOpen ? 'rotate-180' : ''}`} />
              </button>
              {tipsOpen && (
                <ul className="border-t border-paper-dark p-3 space-y-2">
                  {getOfficeTips(navResult.office?.name).map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron" />
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>

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

            <CostComparison procedureId={procedureId} govtFeeInr={docResult?.fee_inr ?? 0} />
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

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => downloadPdf(escResult.pdf_base64, `${procedureId}_rti.pdf`)}
                  >
                    <Download size={14} /> Download RTI PDF
                  </Button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `I need help posting an RTI letter for ${procName}.\n\nOffice: Government office\nLegal basis: ${escResult?.letter?.legal_citations?.[0] || "RTI Act 2005"}\n\nI've generated the letter via PaperTrail AI. Can you help post it?\nhttps://papertrail.ai`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:bg-[#1ea855] transition-colors"
                  >
                    <MessageCircle size={13} /> Ask family to post via WhatsApp
                  </a>
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

            {/* ── First Appeal Card ── */}
            <Card className="border-orange-200/60">
              <CardContent>
                <button
                  onClick={() => setShowFirstAppeal((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h5 className="text-sm font-semibold text-orange-700">
                    📝 First Appeal — if RTI unanswered after 30 days
                  </h5>
                  <span className="text-xs text-text-muted">{showFirstAppeal ? "▲" : "▼"}</span>
                </button>

                {showFirstAppeal && (
                  <div className="mt-3 space-y-3">
                    <pre className="whitespace-pre-wrap rounded-[var(--radius-sm)] bg-paper p-3 text-xs text-text-secondary font-mono leading-relaxed">
                      {firstAppealText}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadText(firstAppealText, `${procedureId}_first_appeal.txt`)}
                    >
                      <Download size={13} /> Download First Appeal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Second Appeal Card ── */}
            <Card className="border-red-200/60">
              <CardContent>
                <button
                  onClick={() => setShowSecondAppeal((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <h5 className="text-sm font-semibold text-red-700">
                    ⚠️ Second Appeal — to Central Information Commission
                  </h5>
                  <span className="text-xs text-text-muted">{showSecondAppeal ? "▲" : "▼"}</span>
                </button>

                {showSecondAppeal && (
                  <div className="mt-3 space-y-3">
                    <p className="text-xs font-medium text-text-secondary">
                      If First Appeal is also ignored after 45 days:
                    </p>
                    <pre className="whitespace-pre-wrap rounded-[var(--radius-sm)] bg-paper p-3 text-xs text-text-secondary font-mono leading-relaxed">
                      {secondAppealText}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadText(secondAppealText, `${procedureId}_second_appeal.txt`)}
                    >
                      <Download size={13} /> Download Second Appeal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <LegalPrecedents procedureId={procedureId} />
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
