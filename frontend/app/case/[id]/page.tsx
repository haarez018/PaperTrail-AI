export default function CasePage({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Case Dashboard
        </h2>
        <p className="text-gray-600">Case ID: {params.id}</p>
        <p className="text-gray-600">Coming in Phase 6.</p>
      </div>
    </main>
  );
}
