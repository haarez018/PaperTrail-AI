import { notFound } from "next/navigation";

async function getCaseData(caseId: string) {
  try {
    // Backend URL — use env var or default
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${baseUrl}/api/case/${caseId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharedCasePage({
  params,
}: {
  params: { caseId: string; token: string };
}) {
  const data = await getCaseData(params.caseId);
  if (!data) notFound();

  // Flatten procedures — they may be nested under plan or at the top level
  const procedures: Array<{ order: number; name_en?: string; procedure_id: string; status?: string }> =
    data.plan?.procedures ?? data.procedures ?? [];

  return (
    <main className="min-h-screen bg-ivory p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-saffron/10 px-4 py-1.5 text-sm font-medium text-saffron-dark">
            👁️ Read-only shared view
          </div>
          <h1 className="font-display text-2xl text-navy">Case Progress</h1>
          <p className="text-text-secondary text-sm mt-1">Case {params.caseId}</p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-paper-dark bg-surface p-6 mb-6">
          <h2 className="font-semibold text-navy mb-4">Procedures</h2>
          <div className="space-y-3">
            {procedures.map((p, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-paper">
                <div>
                  <span className="text-sm font-medium text-navy">
                    {p.order}. {p.name_en || p.procedure_id.replace(/^tn_/, "").replace(/_/g, " ")}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === "done" ? "bg-success/20 text-success" : "bg-paper-dark text-text-muted"
                  }`}
                >
                  {p.status === "done" ? "✓ Done" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-text-muted text-sm mb-3">Want to navigate your own procedures?</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-saffron px-6 py-3 text-sm font-medium text-white hover:bg-saffron-dark transition-colors"
          >
            Start Your Own Case — Free →
          </a>
        </div>
      </div>
    </main>
  );
}
