export default function CaseDashboardLoading() {
  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
          ))}
        </div>
        <div className="h-2 animate-pulse rounded-full bg-paper-dark" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
