import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
      <Link href="/dashboard" className="text-lg font-semibold">
        CloudPulse
      </Link>
      <div className="flex gap-4 text-sm text-slate-300">
        <Link href="/connect">Connect</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/anomalies">Anomalies</Link>
        <Link href="/report">Report</Link>
      </div>
    </nav>
  );
}

