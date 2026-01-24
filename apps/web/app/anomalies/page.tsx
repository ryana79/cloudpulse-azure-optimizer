"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Anomaly[]>("/anomalies", token);
        setAnomalies(data);
      } catch (err: any) {
        setError(err.message);
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
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Detected spikes</p>
            <span className="rounded-full border border-slate-700/70 px-3 py-1 text-xs text-slate-300">
              {anomalies.length} events
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {anomalies.map((a) => (
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
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                  Elevated
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

