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

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Subscription[]>("/subscriptions", token);
        setSubs(data);
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

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const save = async () => {
    try {
      const account = accounts[0] || null;
      const token = await getAccessToken(account);
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
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Connect Azure</h1>
        <p className="text-slate-300">
          Select the subscriptions you want CloudPulse to analyze.
        </p>
        {subs.length === 0 && (
          <div className="rounded border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            No subscriptions found. You may not have RBAC Reader access. Ask your admin to
            grant Reader on the subscription.
          </div>
        )}
        <div className="space-y-2">
          {subs.map((sub) => (
            <label
              key={sub.id}
              className="flex items-center gap-3 rounded border border-slate-800 bg-slate-900 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={selected.includes(sub.id)}
                onChange={() => toggle(sub.id)}
              />
              <span>{sub.display_name}</span>
            </label>
          ))}
        </div>
        <button
          onClick={save}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Save and Ingest
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

