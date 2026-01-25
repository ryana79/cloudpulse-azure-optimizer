import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-start justify-center gap-12 px-6 py-16">
      <section className="grid w-full items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
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
        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signal coverage</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Unified Azure telemetry</h2>
          <p className="mt-2 text-sm text-slate-300">
            Pull cost, advisor, metrics, and resource graph signals into a single optimization
            brief.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-slate-200">
            {[
              "Cost Management + usage series",
              "Advisor recommendations + health",
              "Resource Graph inventory + tags",
              "Metrics & anomalies scoring",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-cyan-400/80" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid w-full gap-4 md:grid-cols-4">
        {[
          { label: "API endpoints", value: "12" },
          { label: "Azure signals", value: "6" },
          { label: "Operator views", value: "7" },
          { label: "Export formats", value: "Markdown + JSON" },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
            <p className="mt-3 text-xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid w-full gap-4 md:grid-cols-3">
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
      </section>

      <section className="grid w-full gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">How it works</p>
          <div className="mt-4 space-y-4">
            {[
              {
                step: "01",
                title: "Connect subscriptions",
                copy: "Securely connect Azure tenants with Entra ID + MSAL and scoped permissions.",
              },
              {
                step: "02",
                title: "Ingest and normalize",
                copy: "Aggregate telemetry streams into a unified cost and health model.",
              },
              {
                step: "03",
                title: "Act on findings",
                copy: "Prioritize savings, export briefs, and assign owners to remediation.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-xs font-semibold text-cyan-200">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-300">{item.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Built for teams</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Operational clarity at a glance</h3>
          <p className="mt-2 text-sm text-slate-300">
            Deliver executive-ready summaries while giving engineers the drill-down context they
            need to act quickly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-300">
            {[
              "Tenant-aware security",
              "Exportable findings",
              "Cost anomaly scoring",
              "Actionable insights",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href="/connect"
            className="mt-6 inline-flex w-fit rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-white"
          >
            Start demo session →
          </Link>
        </div>
      </section>
    </main>
  );
}

