"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMsal } from "@azure/msal-react";
import { useParams, useRouter } from "next/navigation";

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

export default function FindingDetailPage() {
  const { accounts } = useMsal();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const findingId = typeof params?.id === "string" ? params.id : params?.id?.[0];
  const [finding, setFinding] = useState<Finding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (!findingId) {
          setLoading(false);
          return;
        }
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Finding>(`/findings/${findingId}`, token);
        setFinding(data);
        setError(null);
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
  }, [accounts, findingId, router]);

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Finding</p>
            <h1 className="text-3xl font-semibold text-slate-100">Detailed Evidence</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Inspect the rule trigger, severity, and captured metadata used to generate the
              recommendation.
            </p>
          </div>
          <Link
            href="/report"
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
          >
            Back to report
          </Link>
        </div>
        <div className="glass-panel rounded-3xl p-6 md:p-8">
          {loading && <p className="text-sm text-slate-400">Loading finding details...</p>}
          {!loading && finding && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {finding.rule_id.replace(/_/g, " ")}
                </span>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                  {finding.severity}
                </span>
                {finding.estimated_savings && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Est. ${finding.estimated_savings}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white">{finding.title}</h2>
              <p className="text-sm text-slate-300">
                Subscription: <span className="text-slate-200">{finding.subscription_id}</span>
              </p>
              <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Evidence payload
                </p>
                <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950/80 p-4 text-xs text-slate-200">
                  {JSON.stringify(finding.evidence, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {!loading && !finding && !error && (
            <p className="text-sm text-slate-400">No finding available for this id.</p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </main>
    </div>
  );
}

