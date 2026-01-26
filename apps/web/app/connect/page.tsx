"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

import { apiFetch, getAccessToken } from "@/lib/api";
import TopNav from "@/components/TopNav";

type Subscription = {
  id: string;
  display_name: string;
};

const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "1";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
const subsCacheKey = "cloudpulse-subscriptions-cache";
const subsCacheTtlMs = 5 * 60 * 1000;
const selectedSubKey = "cloudpulse-selected-subscription";

function hasDemoSession(): boolean {
  if (!demoMode) return false;
  if (typeof window === "undefined") return true;
  if (sessionStorage.getItem("cloudpulse-demo") !== "1") {
    sessionStorage.setItem("cloudpulse-demo", "1");
  }
  return true;
}

export default function ConnectPage() {
  const { accounts } = useMsal();
  const router = useRouter();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Subscription[]>("/subscriptions", token);
        setSubs(data);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            subsCacheKey,
            JSON.stringify({ timestamp: Date.now(), data })
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
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
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(subsCacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            timestamp: number;
            data: Subscription[];
          };
          if (Date.now() - parsed.timestamp < subsCacheTtlMs) {
            setSubs(parsed.data);
            setIsLoading(false);
            setIsRefreshing(true);
          }
        } catch {
          localStorage.removeItem(subsCacheKey);
        }
      }
    }
    load();
  }, [accounts, router]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const save = async () => {
    try {
      const account = accounts[0] || null;
      const token = await getAccessToken(account);
      if (typeof window !== "undefined") {
        const preferred = selected[0] || "";
        if (preferred) {
          localStorage.setItem(selectedSubKey, preferred);
        } else {
          localStorage.removeItem(selectedSubKey);
        }
      }
      await apiFetch("/ingest", token, {
        method: "POST",
        body: JSON.stringify({ subscription_ids: selected }),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Connect</p>
          <h1 className="text-3xl font-semibold text-white">Select Azure subscriptions</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            In demo mode, CloudPulse uses a curated dataset to simulate subscription-level
            telemetry. Pick the subscriptions you want to analyze and generate insights.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Subscription inventory
            </p>
            {isRefreshing && (
              <p className="mt-2 text-xs text-slate-400">Refreshing subscriptions...</p>
            )}
            {isLoading ? (
              <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-300">
                Loading subscriptions...
              </div>
            ) : subs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-sm text-slate-300">
                No subscriptions found. You may not have RBAC Reader access. Ask your admin to
                grant Reader on the subscription.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {subs.map((sub) => (
                  <label
                    key={sub.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 transition ${
                      selected.includes(sub.id) ? "accent-ring" : ""
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-white">{sub.display_name}</p>
                      <p className="text-xs text-slate-400">ID: {sub.id}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selected.includes(sub.id)}
                      onChange={() => toggle(sub.id)}
                      className="h-4 w-4 accent-cyan-400"
                    />
                  </label>
                ))}
              </div>
            )}
          </section>
          <aside className="glass-panel rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Ingestion summary</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-between">
                <span>Selected</span>
                <span className="text-white">{selected.length}</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Dataset</span>
                <span className="text-white">Demo fixtures</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Runtime</span>
                <span className="text-white">~5s</span>
              </li>
            </ul>
            <button
              onClick={save}
              className="w-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
            >
              Save and Ingest
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}

