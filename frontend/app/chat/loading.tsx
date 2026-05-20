export default function ChatLoading() {
  return (
    <div className="flex h-screen bg-ivory">
      {/* Header skeleton */}
      <div className="flex w-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-paper-dark bg-surface/90 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-paper-dark" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded bg-paper-dark" />
              <div className="h-3 w-20 animate-pulse rounded bg-paper-dark" />
            </div>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 w-16 animate-pulse rounded bg-paper-dark" />
            ))}
          </div>
        </div>
        {/* Message area skeleton */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8">
          <div className="h-10 w-10 animate-pulse rounded-full bg-saffron-light" />
          <div className="h-6 w-48 animate-pulse rounded bg-paper-dark" />
          <div className="h-4 w-72 animate-pulse rounded bg-paper-dark" />
        </div>
        {/* Input skeleton */}
        <div className="border-t border-paper-dark bg-surface p-4">
          <div className="h-12 w-full animate-pulse rounded-[var(--radius-lg)] bg-paper-dark" />
        </div>
      </div>
    </div>
  );
}
