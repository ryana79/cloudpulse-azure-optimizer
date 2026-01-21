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

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Anomalies</h1>
        <div className="space-y-3">
          {anomalies.map((a) => (
            <div key={a.id} className="rounded border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm">
                Spike on {a.date} in {a.scope_type}: {a.scope_value}
              </p>
              <p className="text-xs text-slate-400">
                z={a.z_score.toFixed(2)} cost=${a.cost.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

