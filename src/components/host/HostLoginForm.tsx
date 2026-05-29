"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyPinEdit, digitsOnly } from "@/lib/pin-input";

export function HostLoginForm() {
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

  function updatePin(nextPin: string) {
    setPin(nextPin);
    setError(null);
    requestAnimationFrame(moveCaretToEnd);
  }

  function handlePinChange(raw: string) {
    const nextPin = applyPinEdit(pin, raw);
    if (nextPin !== null) updatePin(nextPin);
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
    if (e.key.length === 1 && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  function handlePinPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = digitsOnly(e.clipboardData.getData("text"));
    if (!pasted) return;
    const nextPin = applyPinEdit(pin, pin + pasted);
    if (nextPin !== null) updatePin(nextPin);
  }

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
