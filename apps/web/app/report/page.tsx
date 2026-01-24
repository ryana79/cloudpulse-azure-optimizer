"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
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

  useEffect(() => {
    const load = async () => {
      try {
        const account = accounts[0] || null;
        const token = await getAccessToken(account);
        const data = await apiFetch<Finding[]>("/findings", token);
        setFindings(data);
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
        <div className="glass-panel rounded-3xl p-6">
          <div className="grid gap-3">
            {findings.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-slate-400">{f.rule_id}</p>
                </div>
                {f.estimated_savings !== null && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    Est. ${f.estimated_savings}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

