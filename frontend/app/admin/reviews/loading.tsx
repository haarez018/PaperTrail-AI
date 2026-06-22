export default function AdminReviewsLoading() {
  return (
    <div className="min-h-screen bg-ivory px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6 animate-pulse">
        <div className="h-12 rounded-[var(--radius-md)] bg-paper-dark" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-[var(--radius-md)] bg-paper-dark" />
          ))}
        </div>
        <div className="h-10 rounded-[var(--radius-md)] bg-paper-dark" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-[var(--radius-md)] bg-paper-dark" />
          ))}
        </div>
      </div>
    </div>
  );
}
