export default function ReviewsLoading() {
  return (
    <main className="min-h-screen bg-ivory px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-4xl space-y-8 animate-pulse">
        <div className="h-48 rounded-[var(--radius-lg)] bg-paper-dark" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 rounded-full bg-paper-dark shrink-0" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-[var(--radius-lg)] bg-paper-dark" />
          ))}
        </div>
      </div>
    </main>
  );
}
