"use client";
import { IndianRupee, MessageCircle, TrendingDown } from "lucide-react";

const AGENT_FEES: Record<string, { min: number; max: number; visits: string }> = {
  death: { min: 2000, max: 5000, visits: "5–8 visits" },
  legal_heir: { min: 3000, max: 6000, visits: "4–6 visits" },
  succession: { min: 8000, max: 15000, visits: "6–10 visits" },
  pension: { min: 2000, max: 4000, visits: "4–7 visits" },
  bank: { min: 1000, max: 2000, visits: "2–3 visits" },
  aadhaar: { min: 200, max: 500, visits: "1–2 visits" },
  default: { min: 1500, max: 3000, visits: "3–5 visits" },
};

function getAgentFee(procedureId: string) {
  if (procedureId.includes("death")) return AGENT_FEES.death;
  if (procedureId.includes("legal_heir")) return AGENT_FEES.legal_heir;
  if (procedureId.includes("succession")) return AGENT_FEES.succession;
  if (procedureId.includes("pension")) return AGENT_FEES.pension;
  if (procedureId.includes("bank") || procedureId.includes("kyc")) return AGENT_FEES.bank;
  if (procedureId.includes("aadhaar")) return AGENT_FEES.aadhaar;
  return AGENT_FEES.default;
}

interface Props {
  procedureId: string;
  govtFeeInr: number;
}

export function CostComparison({ procedureId, govtFeeInr }: Props) {
  const agent = getAgentFee(procedureId);
  const savings = Math.round((agent.min + agent.max) / 2) - govtFeeInr;
  const shareText = encodeURIComponent(
    `I'm saving ₹${savings.toLocaleString('en-IN')} by using PaperTrail AI instead of an agent!\n\nPaperTrail AI is completely free. Government fees only.\nhttps://papertrail.ai`
  );

  return (
    <div className="rounded-[var(--radius-md)] border border-success/30 bg-green-50/50 p-4">
      <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
        <TrendingDown size={14} className="text-success" />
        Cost Comparison
      </h5>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-[var(--radius-sm)] bg-white p-3">
          <p className="text-xs text-text-muted font-medium">WITH PAPERTRAIL AI</p>
          <p className="mt-1 text-xl font-bold text-success flex items-center gap-0.5">
            <IndianRupee size={14} />{govtFeeInr > 0 ? govtFeeInr.toLocaleString('en-IN') : '0'}
          </p>
          <p className="text-xs text-text-secondary">Govt. fee only</p>
          <p className="text-xs text-text-muted mt-1">~2 visits max</p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-white p-3">
          <p className="text-xs text-text-muted font-medium">WITH AGENT</p>
          <p className="mt-1 text-xl font-bold text-danger flex items-center gap-0.5">
            <IndianRupee size={14} />{agent.min.toLocaleString('en-IN')}–{agent.max.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-text-secondary">Agent + misc fees</p>
          <p className="text-xs text-text-muted mt-1">{agent.visits}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-bold text-success">
          You save: ₹{savings.toLocaleString('en-IN')} avg
        </p>
        <a
          href={`https://wa.me/?text=${shareText}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1 text-xs font-medium text-white hover:bg-[#1ea855]"
        >
          <MessageCircle size={11} /> Share savings
        </a>
      </div>
    </div>
  );
}
