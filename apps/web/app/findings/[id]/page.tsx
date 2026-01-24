"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

import TopNav from "@/components/TopNav";
import { apiFetch, getAccessToken } from "@/lib/api";

type Finding = {
  id: string;
  rule_id: string;
  title: string;
  severity: string;
  evidence: Record<string, unknown>;
  estimated_savings: number | null;
  status: string;
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

export default function FindingDetailPage({ params }: { params: { id: string } }) {
  const { accounts } = useMsal();
  const router = useRouter();
  const [finding, setFinding] = useState<Finding | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Finding>(`/findings/${params.id}`, token);
        setFinding(data);
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
  }, [accounts, params.id, router]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-4xl space-y-4 px-6 py-8">
        <h1 className="text-2xl font-semibold">Finding</h1>
        {finding && (
          <div className="rounded border border-slate-800 bg-slate-900 p-4 space-y-2">
            <p className="text-lg font-semibold">{finding.title}</p>
            <p className="text-xs text-slate-400">Rule: {finding.rule_id}</p>
            <p className="text-sm">Severity: {finding.severity}</p>
            <pre className="rounded bg-slate-950 p-3 text-xs text-slate-200">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
            {finding.estimated_savings && (
              <p className="text-sm">Estimated savings: ${finding.estimated_savings}</p>
            )}
          </div>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

