import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-xs font-semibold text-slate-950">
            CP
          </span>
          <div>
            <p className="text-base font-semibold text-slate-100">CloudPulse</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Azure Optimizer</p>
          </div>
        </Link>
        <div className="flex items-center gap-6 text-sm text-slate-300">
          <Link className="transition hover:text-white" href="/connect">
            Connect
          </Link>
          <Link className="transition hover:text-white" href="/dashboard">
            Dashboard
          </Link>
          <Link className="transition hover:text-white" href="/anomalies">
            Anomalies
          </Link>
          <Link className="transition hover:text-white" href="/report">
            Report
          </Link>
          <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200 md:inline-flex">
            Demo Live
          </span>
        </div>
      </div>
    </nav>
  );
}

