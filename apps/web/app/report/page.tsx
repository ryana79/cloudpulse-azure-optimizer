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
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Optimization Report</h1>
        <button
          onClick={exportMarkdown}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Download Markdown Report
        </button>
        <div className="space-y-2">
          {findings.map((f) => (
            <div key={f.id} className="rounded border border-slate-800 bg-slate-900 p-3">
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-slate-400">{f.rule_id}</p>
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </main>
    </div>
  );
}

