import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-block px-4 py-1.5 bg-nyaya-50 text-nyaya-700 rounded-full text-sm font-medium border border-nyaya-100">
            Multi-Agent AI System
          </div>

          <h1 className="text-6xl font-bold tracking-tight text-gray-900">
            Nyaya
            <span className="text-nyaya-600">Mitra</span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            The agentic AI lawyer, accountant, and navigator for the{" "}
            <span className="font-semibold text-gray-900">
              700 million Indians
            </span>{" "}
            who can&apos;t afford one.
          </p>

          <p className="text-lg text-gray-500">
            Tell us what happened. We&apos;ll handle every procedure, form, and
            follow-up.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/chat"
              className="rounded-xl bg-nyaya-600 px-8 py-4 text-lg font-medium text-white shadow-lg shadow-nyaya-600/25 hover:bg-nyaya-700 hover:shadow-nyaya-700/25 transition-all"
            >
              Start a Case
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-t py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What NyayaMitra does
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Identifies All Procedures",
                desc: "Describe your situation in Tamil, Hindi, or English. Our AI identifies every government procedure across departments.",
                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
              },
              {
                title: "Auto-Fills Your Forms",
                desc: "Generates ready-to-submit PDF forms with your details pre-filled. Just print, sign, and submit.",
                icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              },
              {
                title: "Escalates When Stalled",
                desc: "If any office delays your work, NyayaMitra auto-drafts an RTI application citing the exact legal provisions.",
                icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="text-center space-y-3 p-6 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-nyaya-100">
                  <svg
                    className="w-6 h-6 text-nyaya-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-8 bg-nyaya-600 text-white">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold">20+</div>
            <div className="text-nyaya-200 text-sm mt-1">Procedures Covered</div>
          </div>
          <div>
            <div className="text-4xl font-bold">3</div>
            <div className="text-nyaya-200 text-sm mt-1">Languages Supported</div>
          </div>
          <div>
            <div className="text-4xl font-bold">6</div>
            <div className="text-nyaya-200 text-sm mt-1">AI Agents Working For You</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-gray-400 bg-white border-t">
        Built by Haarez | Chennai Institute of Technology | 2026
      </footer>
    </main>
  );
}
