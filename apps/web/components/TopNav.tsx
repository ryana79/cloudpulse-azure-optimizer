"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TopNav() {
  const pathname = usePathname();
  const navItems = [
    { label: "Connect", href: "/connect" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Anomalies", href: "/anomalies" },
    { label: "Report", href: "/report" },
  ];

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
          <div className="hidden items-center gap-5 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition ${
                    isActive ? "text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <span className="relative">
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-cyan-400/70" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
          <span className="hidden rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200 lg:inline-flex">
            Demo Live
          </span>
          <Link
            href="/connect"
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300 hover:text-white"
          >
            Launch demo
          </Link>
        </div>
      </div>
    </nav>
  );
}

