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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">Welcome</h1>
      <p className="text-slate-300">
        {demoMode
          ? "Demo mode is enabled. You will be redirected automatically."
          : "Use your Microsoft/Entra ID account to access your Azure data."}
      </p>
      {!demoMode && (
        <button
          onClick={signIn}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in with Microsoft
        </button>
      )}
      {(mockMode || demoMode) && !demoMode && (
        <button
          onClick={demoLogin}
          className="rounded border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200"
        >
          View Demo Data
        </button>
      )}
      {accounts.length > 0 && (
        <p className="text-xs text-slate-400">Signed in as {accounts[0].username}</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </main>
  );
}

