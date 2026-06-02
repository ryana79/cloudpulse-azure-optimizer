"use client";

import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

import { loginRequest } from "@/lib/auth";

const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "1";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export default function LoginPage() {
  const { instance, accounts } = useMsal();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      sessionStorage.setItem("cloudpulse-demo", "1");
      router.push("/connect");
      return;
    }

    instance
      .handleRedirectPromise()
      .then((result) => {
        if (result?.account) {
          router.push("/connect");
        }
      })
      .catch((err) => setError(err.message));
  }, [instance, router]);

  const signIn = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const demoLogin = () => {
    sessionStorage.setItem("cloudpulse-demo", "1");
    router.push("/connect");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="glass-panel w-full max-w-2xl rounded-3xl px-8 py-10">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Secure Sign-in</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Welcome to CloudPulse</h1>
        <p className="mt-3 text-sm text-slate-300">
          {demoMode
            ? "Demo mode is enabled. You will be redirected automatically."
            : "Use your Microsoft/Entra ID account to access your Azure data."}
        </p>
        {!demoMode && (
          <button
            onClick={signIn}
            className="mt-6 rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"
          >
            Sign in with Microsoft
          </button>
        )}
        {(mockMode || demoMode) && !demoMode && (
          <button
            onClick={demoLogin}
            className="mt-4 rounded-full border border-slate-600/70 px-5 py-2 text-xs font-semibold text-slate-200"
          >
            View Demo Data
          </button>
        )}
        {accounts.length > 0 && (
          <p className="mt-4 text-xs text-slate-400">Signed in as {accounts[0].username}</p>
        )}
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
      </div>
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {["Zero-install demo data", "Live anomaly scoring", "Export-ready reports"].map((label) => (
          <div key={label} className="glass-panel rounded-2xl p-4 text-sm text-slate-300">
            {label}
          </div>
        ))}
      </div>
    </main>
  );
}

