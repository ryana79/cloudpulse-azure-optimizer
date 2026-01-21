import "./styles/globals.css";
import type { Metadata } from "next";

import Providers from "./providers";

export const metadata: Metadata = {
  title: "CloudPulse",
  description: "Azure Cloud Optimization Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

