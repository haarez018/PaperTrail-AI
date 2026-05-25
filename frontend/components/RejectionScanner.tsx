"use client";
import { useState } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Check {
  id: string;
  question: string;
  howToFix?: string;
  weight: number;
}

// Per-procedure checks
const PROCEDURE_CHECKS: Record<string, Check[]> = {
  "tn_death_certificate": [
    { id: "hospital_cert", question: "Hospital death summary / doctor's certificate obtained?", howToFix: "Get from the hospital where death occurred. Ask for the original + 2 attested copies.", weight: 25 },
    { id: "within_21_days", question: "Reporting within 21 days of death?", howToFix: "If >21 days, you need a Magistrate Order first. PaperTrail can guide you.", weight: 20 },
    { id: "aadhaar_match", question: "Aadhaar address matches ration card exactly?", howToFix: "Even minor spelling differences cause rejection. Update Aadhaar first if needed.", weight: 20 },
    { id: "informant_id", question: "Informant (person filing) has their Aadhaar?", weight: 15 },
    { id: "photocopies", question: "Brought 3 sets of photocopies of all documents?", howToFix: "They often ask for 3 copies. Bring more than needed.", weight: 10 },
  ],
  "tn_legal_heir_certificate": [
    { id: "death_cert", question: "Death Certificate obtained (original + 2 copies)?", howToFix: "Death Certificate must be obtained first — Step 1 in your plan.", weight: 30 },
    { id: "affidavit", question: "Affidavit prepared on Rs.20 stamp paper?", howToFix: "Buy stamp paper at the District Court complex. A notary can draft the affidavit for ~₹100.", weight: 25 },
    { id: "witnesses", question: "2 witnesses with their Aadhaars available?", howToFix: "Witnesses must be non-family members who knew the deceased. Neighbors work.", weight: 20 },
    { id: "community_cert", question: "Community certificate of deceased available?", weight: 10 },
  ],
  "default": [
    { id: "originals", question: "All original documents ready (not just photocopies)?", weight: 25 },
    { id: "photocopies_3", question: "3 sets of photocopies of everything?", howToFix: "Government offices often require multiple copies.", weight: 20 },
    { id: "fee_ready", question: "Exact fee amount in cash ready?", howToFix: "Many offices don't give change. Carry exact amount.", weight: 15 },
    { id: "morning_visit", question: "Planning to visit before 11 AM?", howToFix: "Morning visits have shorter queues and more patient officers.", weight: 10 },
  ],
};

interface Props {
  procedureId: string;
  procedureName: string;
  onClose: () => void;
}

export function RejectionScanner({ procedureId, procedureName, onClose }: Props) {
  const checks = PROCEDURE_CHECKS[procedureId] || PROCEDURE_CHECKS["default"];
  const [answers, setAnswers] = useState<Record<string, boolean | null>>(
    Object.fromEntries(checks.map(c => [c.id, null]))
  );

  const toggle = (id: string, val: boolean) => setAnswers(prev => ({ ...prev, [id]: val }));

  const answered = Object.values(answers).filter(v => v !== null).length;
  const score = answered === 0 ? 0 :
    (Object.entries(answers).reduce((acc, [id, val]) => {
      const check = checks.find(c => c.id === id);
      return acc + (val === true ? (check?.weight ?? 10) : 0);
    }, 0) / checks.reduce((a, c) => a + c.weight, 0)) * 100;

  const readiness = score >= 80 ? "Ready to go!" : score >= 60 ? "Almost ready — fix 1-2 issues" : "Not ready — fix issues first";
  const readinessColor = score >= 80 ? "text-success" : score >= 60 ? "text-yellow-600" : "text-danger";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[var(--radius-xl)] bg-ivory p-6 sm:rounded-[var(--radius-xl)] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-navy">Pre-Check: {procedureName}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-navy"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {checks.map(check => (
            <div key={check.id} className="rounded-[var(--radius-md)] border border-paper-dark bg-surface p-3">
              <p className="text-sm font-medium text-navy">{check.question}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => toggle(check.id, true)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${answers[check.id] === true ? 'bg-success text-white' : 'border border-paper-dark text-text-secondary hover:border-success'}`}
                >
                  <CheckCircle2 size={11} /> Yes
                </button>
                <button
                  onClick={() => toggle(check.id, false)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${answers[check.id] === false ? 'bg-danger text-white' : 'border border-paper-dark text-text-secondary hover:border-danger'}`}
                >
                  <XCircle size={11} /> No / Not yet
                </button>
              </div>
              {answers[check.id] === false && check.howToFix && (
                <div className="mt-2 flex items-start gap-1.5 rounded-[var(--radius-sm)] bg-saffron/10 p-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-saffron" />
                  <p className="text-xs text-saffron-dark">{check.howToFix}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {answered > 0 && (
          <div className="mt-4 rounded-[var(--radius-md)] border border-paper-dark bg-paper p-4 text-center">
            <div className="text-3xl font-bold text-navy">{Math.round(score)}%</div>
            <div className={`text-sm font-medium ${readinessColor}`}>{readiness}</div>
          </div>
        )}
      </div>
    </div>
  );
}
