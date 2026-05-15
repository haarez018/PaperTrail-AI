export default function StatsLoading() {
  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
          <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
        </div>
      </div>
    </div>
  );
}
