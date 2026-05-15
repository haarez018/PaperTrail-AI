export default function CasesLoading() {
  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
