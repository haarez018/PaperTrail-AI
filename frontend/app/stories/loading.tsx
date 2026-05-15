export default function StoriesLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="border-b border-paper-dark bg-surface p-12">
        <div className="mx-auto max-w-4xl space-y-4 text-center">
          <div className="mx-auto h-8 w-64 animate-pulse rounded-full bg-paper-dark" />
          <div className="mx-auto h-12 w-96 animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
          <div className="mx-auto mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[var(--radius-md)] bg-paper-dark" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
