import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-start justify-center gap-10 px-6 py-16">
      <div className="max-w-2xl space-y-6">
        <p className="text-xs uppercase tracking-[0.5em] text-cyan-300/70">CloudPulse</p>
        <h1 className="text-5xl font-semibold text-white md:text-6xl">
          See where Azure spend drifts before it hurts.
        </h1>
        <p className="text-base text-slate-300 md:text-lg">
          A modern cloud optimization console that blends cost telemetry, anomalies, and AI
          guidance into a single cockpit.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/connect"
            className="rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
          >
            Open demo dashboard
          </Link>
          <div className="rounded-full border border-slate-700/70 px-4 py-2 text-xs text-slate-300">
            Demo dataset included
          </div>
        </div>
      </div>
      <div className="grid w-full gap-4 md:grid-cols-3">
        {[
          {
            title: "Spend Radar",
            copy: "Track 30-day burn, service breakouts, and subscription drift in one view.",
          },
          {
            title: "Anomaly Pulse",
            copy: "Surface spikes with confidence scoring and plain-English context.",
          },
          {
            title: "Optimization Brief",
            copy: "Export curated recommendations with evidence and estimated savings.",
          },
        ].map((card) => (
          <div key={card.title} className="glass-panel rounded-3xl p-6">
            <h3 className="text-xl font-semibold text-white">{card.title}</h3>
            <p className="mt-3 text-sm text-slate-300">{card.copy}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

