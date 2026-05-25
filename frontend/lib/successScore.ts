export interface ScoreResult {
  score: number;  // 55-95
  label: string;  // "High", "Medium", "Low"
  color: string;  // Tailwind class
  risks: string[];
  boosts: string[];
}

export function calcSuccessScore(procedure: {
  fee_inr?: number;
  estimated_duration_days?: { min: number; max: number };
  depends_on_procedure_ids?: string[];
  procedure_id?: string;
}): ScoreResult {
  let score = 82;
  const risks: string[] = [];
  const boosts: string[] = [];

  if (!procedure.fee_inr || procedure.fee_inr === 0) {
    score += 5; boosts.push("Free procedure — minimal friction");
  }
  if ((procedure.estimated_duration_days?.max ?? 0) > 45) {
    score -= 8; risks.push("Long processing window — follow up proactively");
  }
  if ((procedure.depends_on_procedure_ids?.length ?? 0) > 0) {
    score -= 5; risks.push("Depends on earlier procedures completing first");
  }
  if ((procedure.fee_inr ?? 0) > 200) {
    score -= 5; risks.push("Higher fee — carry exact change");
  }
  if (procedure.procedure_id?.includes("succession")) {
    score -= 8; risks.push("Court-issued certificate — higher complexity");
  }
  if (procedure.procedure_id?.includes("pension")) {
    boosts.push("Right to Services Act SLA protects you");
  }

  score = Math.min(95, Math.max(55, score));
  const label = score >= 80 ? "High" : score >= 65 ? "Medium" : "Low";
  const color = score >= 80 ? "text-success bg-green-100" : score >= 65 ? "text-yellow-700 bg-yellow-100" : "text-danger bg-red-100";

  return { score, label, color, risks, boosts };
}
