"use client";

const MAX_PIN_LENGTH = 16;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** PIN-style input: append digits only; delete from the end via backspace. */
export function applyPinEdit(current: string, nextRaw: string): string | null {
  const next = digitsOnly(nextRaw).slice(0, MAX_PIN_LENGTH);
  if (next === current) return null;
  if (next.startsWith(current)) return next;
  if (current.startsWith(next)) return next;
  return null;
}
