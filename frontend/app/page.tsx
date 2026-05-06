import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Nyaya
          <span className="text-nyaya-600">Mitra</span>
        </h1>

        <p className="text-xl text-gray-600 leading-relaxed">
          The agentic AI lawyer, accountant, and navigator for the{" "}
          <span className="font-semibold text-gray-900">4 billion people</span>{" "}
          who can&apos;t afford one.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/chat"
            className="rounded-lg bg-nyaya-600 px-8 py-3 text-lg font-medium text-white shadow-sm hover:bg-nyaya-700 transition-colors"
          >
            Start a Case
          </Link>
          <a
            href="https://github.com/haarez/nyayamitra"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-300 px-8 py-3 text-lg font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition-colors"
          >
            View Source
          </a>
        </div>

        <div className="pt-8 text-sm text-gray-400">
          Tamil &middot; Hindi &middot; English
        </div>
      </div>
    </main>
  );
}
