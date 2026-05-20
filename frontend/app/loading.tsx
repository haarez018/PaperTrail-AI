export default function RootLoading() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-full bg-saffron-light" />
        <div className="h-5 w-32 animate-pulse rounded bg-paper-dark" />
        <div className="h-3 w-48 animate-pulse rounded bg-paper-dark" />
      </div>
    </div>
  );
}
