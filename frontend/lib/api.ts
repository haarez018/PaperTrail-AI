/** Backend API base URL, configurable via environment variable. */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ── Shared Types ── */

export interface ChatMessage {
  role: "user" | "agent";
  content: string;
  agent?: string;
  timestamp: number;
}

export type ProcedureStatus = "pending" | "in_progress" | "done" | "blocked" | "escalated";

export interface Procedure {
  procedure_id: string;
  order: number;
  depends_on_procedure_ids: string[];
  why_this_is_needed: string;
  estimated_start_after_days: number;
  status: ProcedureStatus;
}

export interface ProcedurePlan {
  case_id: string;
  procedures: Procedure[];
  total_estimated_days: number;
  total_estimated_cost_inr: number;
  without_nyayamitra_baseline_days: number;
  without_nyayamitra_baseline_cost_inr: number;
}

export interface CaseData {
  case_id: string;
  plan?: ProcedurePlan;
  language?: string;
}

/** Shape of a single SSE frame from the /api/chat stream. */
export interface SSEEvent {
  event: string;
  data: Record<string, unknown>;
}

/** Document generation result from the Document Agent. */
export interface DocumentResult {
  procedure_name: string;
  pdf_base64: string;
  pdf_size_bytes: number;
  fee_inr: number;
  checklist?: ChecklistItem[];
}

export interface ChecklistItem {
  name: string;
  mandatory: boolean;
  where_to_get?: string;
}

/** Navigation info for a given procedure. */
export interface NavigationResult {
  office?: {
    name: string;
    address: string;
    counter: string;
    hours: string;
  };
  average_wait_minutes: number;
  best_time_to_visit: string;
  what_to_say: string;
  if_they_ask_X_say_Y: { if_asked: string; say: string }[];
}

/** Escalation (RTI) letter result. */
export interface EscalationResult {
  pdf_base64: string;
  letter?: {
    legal_citations: string[];
    expected_response_days: number;
    fee_inr: number;
    submission_methods: string[];
  };
}

/* ── API Functions ── */

/** Check backend health status. */
export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

/** Stream a chat message to the backend and process SSE events. */
export async function sendMessage(
  message: string,
  caseId: string | null,
  language: string,
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      case_id: caseId,
      message,
      language,
    }),
  });

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    let currentData = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        currentData = line.slice(6).trim();
        try {
          onEvent({ event: currentEvent, data: JSON.parse(currentData) });
        } catch {
          onEvent({ event: currentEvent, data: { raw: currentData } });
        }
      }
    }
  }
}

/** Fetch full case data by ID. */
export async function getCase(caseId: string): Promise<CaseData> {
  const res = await fetch(`${API_URL}/api/case/${caseId}`);
  return res.json();
}

/** Generate a pre-filled PDF form for a procedure. */
export async function generateDocument(procedureId: string, caseId?: string): Promise<DocumentResult> {
  const url = new URL(`${API_URL}/api/documents/${procedureId}`);
  if (caseId) url.searchParams.set("case_id", caseId);
  const res = await fetch(url.toString(), { method: "POST" });
  return res.json();
}

/** Get navigation details for a procedure's office. */
export async function getNavigation(procedureId: string, pincode: string = "600015"): Promise<NavigationResult> {
  const res = await fetch(`${API_URL}/api/navigation/${procedureId}?pincode=${pincode}`);
  return res.json();
}

/** Generate an escalation (RTI) letter for a stalled procedure. */
export async function generateEscalation(
  procedureId: string,
  escalationType: string = "rti",
  caseId?: string
): Promise<EscalationResult> {
  const url = new URL(`${API_URL}/api/escalation/${procedureId}`);
  if (caseId) url.searchParams.set("case_id", caseId);
  url.searchParams.set("escalation_type", escalationType);
  const res = await fetch(url.toString(), { method: "POST" });
  return res.json();
}
