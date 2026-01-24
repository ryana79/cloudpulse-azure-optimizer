"use client";

import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";

import { msalInstance } from "@/lib/auth";

const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (demoMode && typeof window !== "undefined") {
      sessionStorage.setItem("cloudpulse-demo", "1");
    }
    msalInstance
      .initialize()
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-slate-950 text-slate-100" />;
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}

