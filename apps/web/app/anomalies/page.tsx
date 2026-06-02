"use client";

import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

import TopNav from "@/components/TopNav";
import { apiFetch, getAccessToken } from "@/lib/api";

type Anomaly = {
  id: string;
  subscription_id: string;
  scope_type: string;
  scope_value: string;
  date: string;
  z_score: number;
  cost: number;
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

export default function AnomaliesPage() {
  const { accounts } = useMsal();
  const router = useRouter();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Anomaly[]>("/anomalies", token);
        setAnomalies(data);
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

  const scopeOptions = useMemo(() => {
    const scopes = new Set(anomalies.map((a) => a.scope_type));
    return ["all", ...Array.from(scopes).sort()];
  }, [anomalies]);

  const filteredAnomalies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return anomalies.filter((a) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        a.scope_value.toLowerCase().includes(normalizedQuery) ||
        a.subscription_id.toLowerCase().includes(normalizedQuery);
      const matchesScope = scopeFilter === "all" || a.scope_type === scopeFilter;
      return matchesQuery && matchesScope;
    });
  }, [anomalies, query, scopeFilter]);

  const totalCost = anomalies.reduce((sum, a) => sum + a.cost, 0);
  const highestZ = anomalies.reduce((max, a) => Math.max(max, a.z_score), 0);

  const severityBadge = (zScore: number) => {
    if (zScore >= 4.5) return "border-rose-400/30 bg-rose-400/10 text-rose-200";
    if (zScore >= 3.5) return "border-amber-400/30 bg-amber-400/10 text-amber-200";
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header>
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Anomalies</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Cost spike timeline</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Identify unusual spend bursts with z-score severity and contextual scope metadata.
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Events</p>
            <p className="mt-3 text-2xl font-semibold text-white">{anomalies.length}</p>
          </div>
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Peak z-score</p>
            <p className="mt-3 text-2xl font-semibold text-white">{highestZ.toFixed(2)}</p>
          </div>
          <div className="glass-panel rounded-3xl px-5 py-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total impact</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-200">
              ${totalCost.toFixed(2)}
            </p>
          </div>
        </section>
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Detected spikes</p>
            <span className="rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-300">
              {filteredAnomalies.length} events
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-slate-800/70 pb-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search scope or subscription"
              className="w-full rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 md:w-64"
            />
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value)}
              className="rounded-full border border-slate-800/70 bg-slate-950/60 px-4 py-2 text-xs text-slate-200"
            >
              {scopeOptions.map((scope) => (
                <option key={scope} value={scope}>
                  {scope === "all" ? "All scopes" : scope}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 space-y-3">
            {loading && (
              <div className="h-20 animate-pulse rounded-2xl border border-slate-800/70 bg-slate-950/50" />
            )}
            {!loading && filteredAnomalies.length === 0 && (
              <p className="text-sm text-slate-400">No anomalies match the current filters.</p>
            )}
            {filteredAnomalies.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-white">
                    Spike on {a.date} in {a.scope_type}: {a.scope_value}
                  </p>
                  <p className="text-xs text-slate-400">
                    z-score {a.z_score.toFixed(2)} · ${a.cost.toFixed(2)}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${severityBadge(a.z_score)}`}
                >
                  {a.z_score >= 4.5 ? "High" : a.z_score >= 3.5 ? "Medium" : "Low"}
                </span>
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

