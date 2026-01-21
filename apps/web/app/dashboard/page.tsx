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

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const subs = await apiFetch<{ id: string; display_name: string }[]>("/subscriptions", token);
        const subId = subs[0]?.id;
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
      }
    };

    if (!mockMode && accounts.length === 0) {
      router.push("/login");
      return;
    }
    if (mockMode && !sessionStorage.getItem("cloudpulse-demo")) {
      router.push("/login");
      return;
    }
    load();
  }, [accounts, router]);

  const topServices = useMemo(() => summary?.top_services ?? [], [summary]);

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
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        {summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">30d Cost</p>
              <p className="text-2xl font-semibold">${summary.cost_total_30d.toFixed(2)}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Findings</p>
              <p className="text-2xl font-semibold">{summary.findings_count}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Subscription</p>
              <p className="text-xs text-slate-300">{subscriptionId}</p>
            </div>
          </div>
        )}
        <div className="rounded border border-slate-800 bg-slate-900 p-4">
          <p className="mb-2 text-sm text-slate-400">Cost trend (30d)</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costs}>
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#60a5fa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {mockMode && (
          <button
            onClick={regenerateMock}
            className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200"
          >
            Regenerate sample dataset
          </button>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-900 p-4">
            <p className="mb-2 text-sm text-slate-400">Top spend by service</p>
            <ul className="space-y-1 text-sm text-slate-200">
              {topServices.map(([service, count]) => (
                <li key={service} className="flex justify-between">
                  <span>{service}</span>
                  <span className="text-slate-400">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 p-4">
            <p className="mb-2 text-sm text-slate-400">Recent anomalies</p>
            <ul className="space-y-2 text-sm text-slate-200">
              {anomalies.slice(0, 4).map((a) => (
                <li key={a.id} className="rounded border border-slate-800 p-2">
                  <p>
                    Spike in {a.scope_type} {a.scope_value} on {a.date}
                  </p>
                  <p className="text-xs text-slate-400">z={a.z_score.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded border border-slate-800 bg-slate-900 p-4 space-y-3">
          <p className="text-sm text-slate-400">Copilot</p>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Why did my cost spike?"
            className="w-full rounded border border-slate-700 bg-slate-950 p-2 text-sm"
            rows={3}
          />
          <button
            onClick={askCopilot}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Ask Copilot
          </button>
          {copilotAnswer && (
            <div className="rounded border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
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
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

