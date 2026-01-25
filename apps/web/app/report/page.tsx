"use client";

import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import TopNav from "@/components/TopNav";
import { apiFetch, getAccessToken } from "@/lib/api";

type Finding = {
  id: string;
  title: string;
  severity: string;
  rule_id: string;
  estimated_savings: number | null;
};

const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "1";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

function hasDemoSession(): boolean {
  if (!demoMode) return false;
  if (typeof window === "undefined") return true;
  if (sessionStorage.getItem("cloudpulse-demo") !== "1") {
    sessionStorage.setItem("cloudpulse-demo", "1");
  }
  return true;
}

export default function ReportPage() {
  const { accounts } = useMsal();
  const router = useRouter();
  const [findings, setFindings] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("savings");

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Finding[]>("/findings", token);
        setFindings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!mockMode && !demoMode && accounts.length === 0) {
      router.push("/login");
      return;
    }
    if (mockMode && !hasDemoSession()) {
      router.push("/login");
      return;
    }
    if (demoMode && !hasDemoSession() && accounts.length === 0) {
      router.push("/login");
      return;
    }
    load();
  }, [accounts, router]);

  const severityBadge: Record<string, string> = {
    high: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    medium: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  };

  const filteredFindings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = findings.filter((f) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        f.title.toLowerCase().includes(normalizedQuery) ||
        f.rule_id.toLowerCase().includes(normalizedQuery);
      const matchesSeverity =
        severityFilter === "all" || f.severity.toLowerCase() === severityFilter;
      return matchesQuery && matchesSeverity;
    });
    if (sortBy === "savings") {
      return [...filtered].sort(
        (a, b) => (b.estimated_savings ?? 0) - (a.estimated_savings ?? 0)
      );
    }
    return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  }, [findings, query, severityFilter, sortBy]);

  const totalSavings = findings.reduce((sum, f) => sum + (f.estimated_savings ?? 0), 0);
  const highCount = findings.filter((f) => f.severity.toLowerCase() === "high").length;
  const mediumCount = findings.filter(
    (f) => f.severity.toLowerCase() === "medium"
  ).length;
  const lowCount = findings.filter((f) => f.severity.toLowerCase() === "low").length;

  const exportMarkdown = () => {
    const lines = ["# CloudPulse Optimization Report", ""];
    findings.forEach((f) => {
      lines.push(`## ${f.title}`);
      lines.push(`- Severity: ${f.severity}`);
      lines.push(`- Rule: ${f.rule_id}`);
      if (f.estimated_savings) {
        lines.push(`- Estimated savings: $${f.estimated_savings}`);
      }
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cloudpulse-report.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Report</p>
            <h1 className="text-3xl font-semibold text-white">Optimization brief</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Export a recruiter-ready summary of the most valuable optimization opportunities.
            </p>
          </div>
          <button
            onClick={exportMarkdown}
            className="rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950"
          >
            Download Markdown Report
          </button>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Findings</p>
            <p className="mt-3 text-2xl font-semibold text-white">{findings.length}</p>
          </div>
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Est. savings</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-200">
              ${totalSavings.toFixed(2)}
            </p>
          </div>
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Severity mix</p>
            <p className="mt-3 text-sm text-slate-200">
              High {highCount} · Medium {mediumCount} · Low {lowCount}
            </p>
          </div>
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Format</p>
            <p className="mt-3 text-sm text-slate-200">Markdown + JSON-ready</p>
          </div>
        </section>

        <div className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-800/70 pb-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search findings"
              className="w-full rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 md:w-64"
            />
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-xs text-slate-200"
            >
              <option value="all">All severities</option>
              <option value="high">High only</option>
              <option value="medium">Medium only</option>
              <option value="low">Low only</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-xs text-slate-200"
            >
              <option value="savings">Sort by savings</option>
              <option value="title">Sort by title</option>
            </select>
          </div>

          <div className="grid gap-3 pt-4">
            {loading && <p className="text-sm text-slate-400">Loading findings...</p>}
            {!loading && filteredFindings.length === 0 && (
              <p className="text-sm text-slate-400">No findings match the current filters.</p>
            )}
            {filteredFindings.map((f) => (
              <Link
                key={f.id}
                href={`/findings/${f.id}`}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-4 py-3 transition hover:border-cyan-400/40 hover:bg-slate-950/70"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{f.rule_id}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] ${
                        severityBadge[f.severity.toLowerCase()] ??
                        "border-slate-700/70 bg-slate-900/60 text-slate-300"
                      }`}
                    >
                      {f.severity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {f.estimated_savings !== null && (
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                      Est. ${f.estimated_savings}
                    </span>
                  )}
                  <span className="text-[11px] text-cyan-300/70 group-hover:text-cyan-200">
                    View details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

