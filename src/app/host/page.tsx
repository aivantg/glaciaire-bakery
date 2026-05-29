"use client";

import { Suspense } from "react";
import { HostLoginForm } from "@/components/host/HostLoginForm";

export default function HostLoginPage() {
  return (
    <div className="pt-6">
      <a href="/" className="link-mono mb-8 inline-flex items-center gap-2">
        ← back to menu
      </a>

      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <p className="brand-presents text-lg sm:text-xl">Glaciaire presents</p>
        <h1 className="hero-stack mt-3 text-7xl sm:text-[8rem] text-center">
          host
        </h1>

        <Suspense fallback={null}>
          <HostLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
