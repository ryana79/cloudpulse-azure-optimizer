import { AccountInfo } from "@azure/msal-browser";

import { apiRequest, msalInstance } from "./auth";

const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const mockMode = process.env.NEXT_PUBLIC_MOCK_MODE === "1";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

function isDemoSession(): boolean {
  if (!demoMode) return false;
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("cloudpulse-demo") === "1";
}

export async function getAccessToken(account: AccountInfo | null): Promise<string> {
  if (mockMode) {
    return "mock";
  }
  if (isDemoSession()) {
    return "demo";
  }
  if (!account) {
    throw new Error("Missing account");
  }
  const result = await msalInstance.acquireTokenSilent({
    ...apiRequest,
    account,
  });
  return result.accessToken;
}

export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(isDemoSession() ? { "X-Demo-Mode": "1" } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}

