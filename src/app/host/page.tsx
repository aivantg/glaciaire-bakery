"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function HostLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/menu";

  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, skip the screen.
  useEffect(() => {
    fetch("/api/host/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.authenticated) router.replace(next);
      })
      .catch(() => {});
  }, [router, next]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/host/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        router.replace(next);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Wrong PIN.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 w-full max-w-xs flex flex-col items-center gap-5"
    >
      <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
        enter pin
      </label>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="w-full bg-transparent border-0 border-b-2 border-ink-400/40 focus:border-ink-900 focus:outline-none font-sans text-center text-ink-900 placeholder-ink-300 py-2 text-2xl tracking-[0.5em]"
        placeholder="••••"
      />

      {error && <p className="font-sans text-bakery-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting || pin.length === 0}
        className="btn-dark"
      >
        {submitting ? "checking…" : "unlock"}
      </button>
    </form>
  );
}

export default function HostLoginPage() {
  return (
    <div className="pt-6">
      <a
        href="/order"
        className="link-mono mb-8 inline-flex items-center gap-2"
      >
        ← back to menu
      </a>

      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <p className="brand-presents text-lg sm:text-xl">Glaciare presents</p>
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
