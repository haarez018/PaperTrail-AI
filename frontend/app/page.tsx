import Link from "next/link";
import {
  Scale,
  ClipboardList,
  FileText,
  AlertTriangle,
  MapPin,
  Brain,
  Globe,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "Identifies All Procedures",
    desc: "Describe your situation in Tamil, Hindi, or English. Our AI identifies every government procedure across departments.",
    icon: ClipboardList,
  },
  {
    title: "Auto-Fills Your Forms",
    desc: "Generates ready-to-submit PDF forms with your details pre-filled. Just print, sign, and submit.",
    icon: FileText,
  },
  {
    title: "Escalates When Stalled",
    desc: "If any office delays your work, NyayaMitra auto-drafts an RTI application citing the exact legal provisions.",
    icon: AlertTriangle,
  },
];

const stats = [
  { value: "20+", label: "Procedures Covered" },
  { value: "3", label: "Languages Supported" },
  { value: "6", label: "AI Agents Working For You" },
];

const agents = [
  { name: "Intake", desc: "Understands your life event", icon: Brain },
  { name: "Planner", desc: "Maps every step", icon: ClipboardList },
  { name: "Document", desc: "Generates your forms", icon: FileText },
  { name: "Navigation", desc: "Tells you where to go", icon: MapPin },
  { name: "Escalation", desc: "Fights delays for you", icon: AlertTriangle },
  { name: "i18n", desc: "Works in your language", icon: Globe },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-ivory">
      {/* ── Hero ── */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-8">
        <div className="max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron/20 bg-saffron-light px-4 py-1.5 text-sm font-semibold text-saffron-dark">
            <Scale size={14} />
            Multi-Agent AI System
          </span>

          <h1 className="font-display text-5xl tracking-tight text-navy sm:text-6xl">
            Nyaya<span className="text-saffron">Mitra</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
            The agentic AI lawyer, accountant, and navigator for the{" "}
            <span className="font-semibold text-navy">700 million Indians</span>{" "}
            who can&apos;t afford one.
          </p>

          <p className="text-base text-text-muted sm:text-lg">
            Tell us what happened. We&apos;ll handle every procedure, form, and
            follow-up.
          </p>

          <div className="flex justify-center pt-4">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-[var(--radius-lg)] bg-saffron px-8 py-4 text-lg font-semibold text-white shadow-card transition-all duration-[var(--duration-base)] hover:bg-saffron-dark hover:shadow-card-hover active:scale-[0.98]"
            >
              Start a Case
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-paper-dark bg-white px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center font-display text-3xl text-navy">
            What NyayaMitra does
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group space-y-3 rounded-[var(--radius-lg)] p-6 text-center transition-all duration-[var(--duration-base)] hover:bg-saffron-light/30 hover:shadow-card"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-saffron-light">
                    <Icon size={24} className="text-saffron-dark" />
                  </div>
                  <h3 className="font-display text-lg text-navy">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Agent Grid ── */}
      <section className="border-t border-paper-dark bg-ivory px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center font-display text-3xl text-navy">
            6 AI Agents, One Mission
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {agents.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.name}
                  className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-paper-dark bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-card"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-light">
                    <Icon size={18} className="text-saffron-dark" />
                  </div>
                  <p className="text-sm font-semibold text-navy">{a.name}</p>
                  <p className="text-[11px] leading-tight text-text-muted">
                    {a.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-navy px-4 py-12 sm:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-display text-4xl text-white">{s.value}</div>
              <div className="mt-1 text-sm text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-paper-dark bg-white px-8 py-6 text-center text-sm text-text-muted">
        Built by Haarez · Chennai Institute of Technology · 2026
      </footer>
    </main>
  );
}
