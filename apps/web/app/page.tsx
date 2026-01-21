import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-6 px-6">
      <h1 className="text-4xl font-semibold">CloudPulse</h1>
      <p className="text-slate-300">
        Multi-tenant Azure Cloud Optimization Dashboard with cost insights, anomalies, and an AI
        copilot.
      </p>
      <Link
        href="/login"
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Sign in with Microsoft
      </Link>
    </main>
  );
}

