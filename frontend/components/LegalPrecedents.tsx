"use client";
import { useState } from "react";
import { Scale, ChevronDown, Copy } from "lucide-react";

const PRECEDENTS: Record<string, { case: string; ruling: string; relevance: string }[]> = {
  death: [
    { case: "RBD Act 1969, Section 12-13", ruling: "Death registration is compulsory within 21 days", relevance: "Basis for your application" },
    { case: "Tamil Nadu Right to Services Act 2012", ruling: "Death Certificate SLA: 3 working days", relevance: "Cite if delayed beyond 3 days" },
    { case: "Madras HC, W.P. 12456/2017", ruling: "Municipal bodies cannot demand fees beyond prescribed rates", relevance: "If they ask for extra payment" },
  ],
  legal_heir: [
    { case: "TN Legal Heir Certificate Rules 1966", ruling: "Certificate must be issued within 30 days of complete application", relevance: "Cite if Tahsildar delays beyond 30 days" },
    { case: "Revenue Standing Order 1104", ruling: "Tahsildar must personally verify and sign within 21 days", relevance: "Escalate to Collector if Tahsildar stalls" },
  ],
  pension: [
    { case: "TN Right to Services Act 2012 — Schedule", ruling: "Pension transfer SLA: 45 days. Officer personally fined ₹250/day for delay", relevance: "Most powerful citation — officers take this seriously" },
    { case: "CCS Pension Rules 1972, Rule 81", ruling: "Family pension must be sanctioned within 1 month of death", relevance: "Central government employees" },
  ],
  default: [
    { case: "RTI Act 2005, Section 6(1)", ruling: "Information must be provided within 30 days", relevance: "Basis for all RTI applications" },
    { case: "RTI Act 2005, Section 19(8)(b)", ruling: "CIC can impose penalty of ₹250/day up to ₹25,000 on erring officers", relevance: "Mention in RTI to signal you know your rights" },
    { case: "TN Right to Services Act 2012", ruling: "All government services have legally mandated timelines", relevance: "Officers are personally liable for delays" },
  ],
};

function getPrecedents(procedureId: string) {
  if (procedureId.includes("death")) return PRECEDENTS.death;
  if (procedureId.includes("legal_heir")) return PRECEDENTS.legal_heir;
  if (procedureId.includes("pension")) return PRECEDENTS.pension;
  return PRECEDENTS.default;
}

interface Props { procedureId: string; }

export function LegalPrecedents({ procedureId }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const items = getPrecedents(procedureId);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-paper-dark bg-surface">
      <button
        className="flex w-full items-center justify-between p-3 text-sm font-semibold text-navy"
        onClick={() => setOpen(!open)}
      >
        <span className="flex items-center gap-2"><Scale size={14} className="text-saffron" /> Legal Precedents &amp; Your Rights</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-paper-dark p-3 space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-[var(--radius-sm)] bg-paper p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-navy">{item.case}</p>
                <button
                  onClick={() => handleCopy(`${item.case}: ${item.ruling}`, String(i))}
                  className="shrink-0 text-text-muted hover:text-saffron"
                  title="Copy citation"
                >
                  {copied === String(i) ? "✓" : <Copy size={11} />}
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary">{item.ruling}</p>
              <p className="mt-1 text-xs font-medium text-saffron-dark">→ {item.relevance}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
