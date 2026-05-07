const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  role: "user" | "agent";
  content: string;
  agent?: string;
  timestamp: number;
}

export interface Procedure {
  procedure_id: string;
  order: number;
  depends_on_procedure_ids: string[];
  why_this_is_needed: string;
  estimated_start_after_days: number;
  status: string;
}

export interface ProcedurePlan {
  case_id: string;
  procedures: Procedure[];
  total_estimated_days: number;
  total_estimated_cost_inr: number;
  without_nyayamitra_baseline_days: number;
  without_nyayamitra_baseline_cost_inr: number;
}

export interface SSEEvent {
  event: string;
  data: any;
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`);
  return res.json();
}

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
          onEvent({ event: currentEvent, data: currentData });
        }
      }
    }
  }
}

export async function getCase(caseId: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/case/${caseId}`);
  return res.json();
}

export async function generateDocument(procedureId: string, caseId?: string): Promise<any> {
  const url = new URL(`${API_URL}/api/documents/${procedureId}`);
  if (caseId) url.searchParams.set("case_id", caseId);
  const res = await fetch(url.toString(), { method: "POST" });
  return res.json();
}

export async function getNavigation(procedureId: string, pincode: string = "600015"): Promise<any> {
  const res = await fetch(`${API_URL}/api/navigation/${procedureId}?pincode=${pincode}`);
  return res.json();
}

export async function generateEscalation(
  procedureId: string,
  escalationType: string = "rti",
  caseId?: string
): Promise<any> {
  const url = new URL(`${API_URL}/api/escalation/${procedureId}`);
  if (caseId) url.searchParams.set("case_id", caseId);
  url.searchParams.set("escalation_type", escalationType);
  const res = await fetch(url.toString(), { method: "POST" });
  return res.json();
}
