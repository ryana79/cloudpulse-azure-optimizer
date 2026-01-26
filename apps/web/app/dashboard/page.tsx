"use client";

import { useEffect, useMemo, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRouter } from "next/navigation";

import TopNav from "@/components/TopNav";
import { apiFetch, getAccessToken } from "@/lib/api";

type Summary = {
  cost_total_30d: number;
  top_services: [string, number][];
  inventory_by_region: Record<string, number>;
  inventory_by_type: Record<string, number>;
  findings_count: number;
};

type CostPoint = {
  date: string;
  cost: number;
};

type Anomaly = {
  id: string;
  scope_type: string;
  scope_value: string;
  date: string;
  z_score: number;
  cost: number;
};

const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "1";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
const selectedSubKey = "cloudpulse-selected-subscription";

function hasDemoSession(): boolean {
  if (!demoMode) return false;
  if (typeof window === "undefined") return true;
  if (sessionStorage.getItem("cloudpulse-demo") !== "1") {
    sessionStorage.setItem("cloudpulse-demo", "1");
  }
  return true;
}

export default function DashboardPage() {
  const { accounts } = useMsal();
  const router = useRouter();
  const [subscriptionId, setSubscriptionId] = useState<string>("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [costs, setCosts] = useState<CostPoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [question, setQuestion] = useState("");
  const [copilotAnswer, setCopilotAnswer] = useState<string | null>(null);
  const [copilotWarnings, setCopilotWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const subs = await apiFetch<{ id: string; display_name: string }[]>("/subscriptions", token);
        let preferred: string | null = null;
        if (typeof window !== "undefined") {
          preferred = localStorage.getItem(selectedSubKey);
        }
        const subId =
          subs.find((sub) => sub.id === preferred)?.id || subs[0]?.id;
        if (!subId) return;
        setSubscriptionId(subId);
        const summaryData = await apiFetch<Summary>(`/summary?subscription_id=${subId}`, token);
        const costData = await apiFetch<{ points: CostPoint[] }>(
          `/cost/timeseries?subscription_id=${subId}`,
          token
        );
        const anomaliesData = await apiFetch<Anomaly[]>(`/anomalies?subscription_id=${subId}`, token);
        setSummary(summaryData);
        setCosts(costData.points);
        setAnomalies(anomaliesData);
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

  const topServices = useMemo(() => summary?.top_services ?? [], [summary]);
  const dataMode = mockMode ? "Mock" : demoMode ? "Demo" : "Live";

  const askCopilot = async () => {
    try {
      if (!subscriptionId) return;
      const account = accounts[0] || null;
      const token = await getAccessToken(account);
      const result = await apiFetch<{ answer: string; warnings: string[] }>(
        "/copilot/chat",
        token,
        {
          method: "POST",
          body: JSON.stringify({ question, subscription_id: subscriptionId }),
        }
      );
      setCopilotAnswer(result.answer);
      setCopilotWarnings(result.warnings || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const regenerateMock = async () => {
    try {
      const account = accounts[0] || null;
      const token = await getAccessToken(account);
      await apiFetch("/ingest", token, { method: "POST", body: JSON.stringify({ subscription_ids: [] }) });
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Command Center</p>
            <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Monitor 30-day spend momentum, anomaly bursts, and optimization signals across
              subscriptions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700/70 px-3 py-1">
              Mode: {dataMode}
            </span>
            {subscriptionId && (
              <span className="rounded-full border border-slate-700/70 px-3 py-1">
                Sub: {subscriptionId.slice(0, 8)}...
              </span>
            )}
          </div>
          {(mockMode || demoMode) && (
            <button
              onClick={regenerateMock}
              className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
            >
              Regenerate sample dataset
            </button>
          )}
        </header>
        {loading && (
          <div className="grid gap-4 md:grid-cols-3">
            {["30d Cost", "Findings", "Subscription"].map((label) => (
              <div key={label} className="glass-panel rounded-3xl p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
                <div className="mt-4 h-8 w-32 animate-pulse rounded-full bg-slate-800/70" />
                <div className="mt-3 h-3 w-40 animate-pulse rounded-full bg-slate-800/60" />
              </div>
            ))}
          </div>
        )}
        {!loading && summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">30d Cost</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                ${summary.cost_total_30d.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-slate-400">Rolling 30-day window</p>
            </div>
            <div className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Findings</p>
              <p className="mt-3 text-3xl font-semibold text-white">{summary.findings_count}</p>
              <p className="mt-2 text-xs text-slate-400">Optimization signals queued</p>
            </div>
            <div className="glass-panel rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Subscription</p>
              <p className="mt-3 text-sm text-white">{subscriptionId || "Not selected"}</p>
              <p className="mt-2 text-xs text-slate-400">{dataMode} dataset</p>
            </div>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Cost trend (30d)
              </p>
              <span className="rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-300">
                Daily granularity
              </span>
            </div>
            <div className="mt-4 h-64">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded-2xl bg-slate-900/60" />
              ) : costs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={costs}>
                    <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="cost" stroke="#38bdf8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-800/70 text-sm text-slate-400">
                  No cost data available yet.
                </div>
              )}
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Top spend by service
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {loading && (
                <li className="h-16 animate-pulse rounded-2xl border border-slate-800/70 bg-slate-950/40" />
              )}
              {!loading && topServices.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-800/70 px-4 py-4 text-sm text-slate-400">
                  No service breakdown available yet.
                </li>
              )}
              {topServices.map(([service, count]) => (
                <li
                  key={service}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3"
                >
                  <span className="font-semibold text-white">{service}</span>
                  <span className="text-slate-400">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr]">
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Recent anomalies</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {loading && (
                <li className="h-20 animate-pulse rounded-2xl border border-slate-800/70 bg-slate-950/40" />
              )}
              {!loading && anomalies.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-800/70 px-4 py-4 text-sm text-slate-400">
                  No anomalies detected for this window.
                </li>
              )}
              {anomalies.slice(0, 4).map((a) => (
                <li key={a.id} className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-3">
                  <p className="text-white">
                    Spike in {a.scope_type} {a.scope_value}
                  </p>
                  <p className="text-xs text-slate-400">
                    {a.date} · z={a.z_score.toFixed(2)} · ${a.cost.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Copilot</p>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                Demo mode
              </span>
            </div>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Why did my cost spike?"
              className="w-full rounded-2xl border border-slate-700/70 bg-slate-950/60 p-3 text-sm text-slate-200"
              rows={3}
            />
            <button
              onClick={askCopilot}
              className="w-fit rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-5 py-2 text-sm font-semibold text-slate-950"
            >
              Ask Copilot
            </button>
            {copilotAnswer && (
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-200">
                {copilotAnswer}
              </div>
            )}
            {copilotWarnings.length > 0 && (
              <ul className="text-xs text-amber-300">
                {copilotWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

