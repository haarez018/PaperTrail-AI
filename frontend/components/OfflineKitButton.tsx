"use client";
import { Download } from "lucide-react";
import { ProcedurePlan } from "@/lib/api";

interface Props {
  plan: ProcedurePlan;
  caseId: string;
}

// Extended Procedure fields that may be present in the plan returned from backend
interface ProcedureExtended {
  procedure_id: string;
  order: number;
  depends_on_procedure_ids?: string[];
  why_this_is_needed?: string;
  estimated_duration_days?: { min?: number; max?: number };
  fee_inr?: number;
  documents_required?: { name: string; mandatory?: boolean }[];
}

const OFFICE_DATA: Record<string, { address: string; hours: string; counter: string }> = {
  death: { address: "Ripon Building, Park Town, Chennai - 600003", hours: "Mon-Fri 10:00-17:00", counter: "Birth & Death Registration" },
  legal_heir: { address: "Tahsildar Office, District Collectorate", hours: "Mon-Fri 10:00-17:00", counter: "Revenue Counter" },
  pension: { address: "Treasury Office / District Collectorate", hours: "Mon-Fri 10:00-17:00", counter: "Pension Section" },
  default: { address: "Contact your local Tahsildar / Municipal Office", hours: "Mon-Fri 10:00-17:00", counter: "General Counter" },
};

function getOffice(procedureId: string) {
  if (procedureId.includes("death")) return OFFICE_DATA.death;
  if (procedureId.includes("legal_heir") || procedureId.includes("succession")) return OFFICE_DATA.legal_heir;
  if (procedureId.includes("pension")) return OFFICE_DATA.pension;
  return OFFICE_DATA.default;
}

function generateHTML(plan: ProcedurePlan, caseId: string): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const procedureHTML = (plan.procedures as unknown as ProcedureExtended[]).map((proc) => {
    const office = getOffice(proc.procedure_id);
    const name = proc.procedure_id.replace(/^tn_/, "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return `
      <div class="procedure" style="page-break-inside: avoid; margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #1b2a4a; border-bottom: 2px solid #ed8936; padding-bottom: 8px;">
          Step ${proc.order}: ${name}
        </h2>
        <p style="color: #666;">${proc.why_this_is_needed ?? ""}</p>

        <table style="width: 100%; margin: 12px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px; background: #f5f0e8; font-weight: bold; width: 30%;">Office</td>
            <td style="padding: 6px;">${office.address}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f5f0e8; font-weight: bold;">Hours</td>
            <td style="padding: 6px;">${office.hours}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f5f0e8; font-weight: bold;">Counter</td>
            <td style="padding: 6px;">${office.counter}</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f5f0e8; font-weight: bold;">Est. Time</td>
            <td style="padding: 6px;">${proc.estimated_duration_days?.min ?? "?"}–${proc.estimated_duration_days?.max ?? "?"} days</td>
          </tr>
          <tr>
            <td style="padding: 6px; background: #f5f0e8; font-weight: bold;">Govt. Fee</td>
            <td style="padding: 6px;">₹${proc.fee_inr ?? 0}</td>
          </tr>
        </table>

        <h3 style="color: #1b2a4a;">Documents to Bring:</h3>
        <ul>
          ${(proc.documents_required ?? []).map(d =>
            `<li style="margin: 4px 0;"><label><input type="checkbox" style="margin-right: 8px;"> ${d.name}${d.mandatory ? ' <strong style="color:red;">(Required)</strong>' : ''}</label></li>`
          ).join("") || "<li>Check PaperTrail AI app for document list</li>"}
        </ul>

        <div style="margin: 16px 0; padding: 12px; background: #f9f3e8; border-left: 3px solid #ed8936; border-radius: 4px;">
          <strong>What to say at the counter:</strong><br>
          "I am here to apply for ${name}. I have all required documents as per the Registration of Births and Deaths Act / Right to Services Act."
        </div>

        <div style="margin-top: 16px; padding: 12px; border: 1px dashed #999; border-radius: 4px;">
          <strong>Acknowledgement Receipt</strong> (paste/write here after submission):<br><br>
          Reference No: _______________________<br>
          Date submitted: ___________________<br>
          Expected by: ______________________<br>
          Officer name: _____________________<br>
        </div>

        ${(proc.depends_on_procedure_ids ?? []).length ?
          `<p style="color: #666; font-size: 13px; margin-top: 8px;">⚠️ <strong>Requires first:</strong> ${(proc.depends_on_procedure_ids ?? []).join(", ")}</p>`
          : ""}
      </div>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PaperTrail AI — Offline Kit — ${caseId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
    h1 { color: #1b2a4a; }
    .cover { text-align: center; padding: 40px 20px; border-bottom: 3px solid #ed8936; margin-bottom: 30px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .stat { padding: 16px; background: #f5f0e8; border-radius: 8px; text-align: center; }
    .stat .num { font-size: 28px; font-weight: bold; color: #ed8936; }
    .print-btn { background: #ed8936; color: white; border: none; padding: 12px 24px; font-size: 16px; border-radius: 8px; cursor: pointer; margin: 16px auto; display: block; }
    .emergency { margin-top: 40px; padding: 20px; background: #fff0f0; border: 1px solid #ffaaaa; border-radius: 8px; }
  </style>
</head>
<body>

<div class="no-print" style="text-align: center; padding: 16px; background: #f5f0e8; border-radius: 8px; margin-bottom: 20px;">
  <strong>📄 PaperTrail AI — Offline Kit</strong> — Print this page or save as PDF for offline use.<br>
  <button class="print-btn" onclick="window.print()">🖨️ Print This Kit</button>
</div>

<div class="cover">
  <img src="https://papertrail.ai/logo.png" alt="PaperTrail AI" style="height: 48px; margin-bottom: 16px;" onerror="this.style.display='none'">
  <h1>⚖️ PaperTrail AI — Offline Procedure Kit</h1>
  <p style="color: #666;">Case ID: <strong>${caseId}</strong> | Generated: ${today}</p>
  <p style="color: #666; font-size: 14px;">Keep this document safe. Take it to every government office.</p>
</div>

<div class="stats">
  <div class="stat"><div class="num">${plan.procedures.length}</div><div>Procedures</div></div>
  <div class="stat"><div class="num">${plan.total_estimated_days}</div><div>Est. Days</div></div>
  <div class="stat"><div class="num">₹${plan.total_estimated_cost_inr}</div><div>Total Fees</div></div>
</div>

<h2 style="color: #1b2a4a; margin-top: 30px;">Your Step-by-Step Procedures</h2>
${procedureHTML}

<div class="emergency">
  <h3 style="color: #cc0000;">🆘 Emergency Contacts</h3>
  <ul>
    <li><strong>RTI Helpline:</strong> 1800-11-0001 (free)</li>
    <li><strong>Tamil Nadu Grievance Redressal:</strong> 1100</li>
    <li><strong>Chief Minister Helpline:</strong> 1100 / 044-28522888</li>
    <li><strong>Central RTI Online:</strong> https://rtionline.gov.in</li>
    <li><strong>TN e-District:</strong> https://edistrict.tn.gov.in</li>
  </ul>
</div>

<div style="text-align: center; margin-top: 40px; color: #999; font-size: 13px;">
  Generated by PaperTrail AI — https://papertrail.ai — Free for all Indians
</div>

</body>
</html>`;
}

export function OfflineKitButton({ plan, caseId }: Props) {
  const handleDownload = () => {
    const html = generateHTML(plan, caseId);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PaperTrail-${caseId}-OfflineKit.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-paper-dark bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:border-saffron/40 hover:text-saffron-dark transition-colors"
    >
      <Download size={14} />
      Download Offline Kit
    </button>
  );
}
