"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

const MAX_PIN_LENGTH = 16;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** PIN-style input: append digits only; delete from the end via backspace. */
function applyPinEdit(current: string, nextRaw: string): string | null {
  const next = digitsOnly(nextRaw).slice(0, MAX_PIN_LENGTH);
  if (next === current) return null;
  if (next.startsWith(current)) return next;
  if (current.startsWith(next)) return next;
  return null;
}

function HostLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/menu";

  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  function moveCaretToEnd() {
    const el = pinInputRef.current;
    if (!el) return;
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }

  function updatePin(next: string) {
    setPin(next);
    setError(null);
    requestAnimationFrame(moveCaretToEnd);
  }

  function handlePinChange(raw: string) {
    const next = applyPinEdit(pin, raw);
    if (next !== null) updatePin(next);
    else requestAnimationFrame(moveCaretToEnd);
  }

  function handlePinKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "Home" ||
      e.key === "End" ||
      e.key === "Delete"
    ) {
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (pin.length > 0) updatePin(pin.slice(0, -1));
      return;
    }
    // Digits flow through onChange (works on mobile keyboards). Block other keys.
    if (e.key.length === 1 && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handlePinPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = digitsOnly(e.clipboardData.getData("text"));
    if (!pasted) return;
    const next = applyPinEdit(pin, pin + pasted);
    if (next !== null) updatePin(next);
  }

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
        ref={pinInputRef}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={pin}
        onChange={(e) => handlePinChange(e.target.value)}
        onKeyDown={handlePinKeyDown}
        onPaste={handlePinPaste}
        onClick={moveCaretToEnd}
        onFocus={moveCaretToEnd}
        onSelect={moveCaretToEnd}
        className="w-full bg-transparent border-0 border-b-2 border-ink-400/40 focus:border-ink-900 focus:outline-none font-sans text-center text-ink-900 placeholder-ink-300 py-2 text-2xl tracking-[0.5em] caret-transparent"
        placeholder="••••"
        aria-label="Host PIN"
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
