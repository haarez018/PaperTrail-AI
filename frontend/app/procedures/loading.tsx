export default function ProceduresLoading() {
  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-10 w-full max-w-md animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
