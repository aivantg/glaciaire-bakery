/** Format cents as a dollar amount without the leading `$` (e.g. "3.50"). */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatUnitsOrdered(count: number): string {
  if (count === 0) return "never ordered";
  if (count === 1) return "1 ordered";
  return `${count} ordered`;
}
