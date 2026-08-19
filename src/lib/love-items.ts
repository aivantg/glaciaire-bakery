export const DEFAULT_LOVE_ITEMS = "cookies, fruit, pastry";

export function parseLoveItems(raw?: string | null): string[] {
  const items = (raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  if (items.length > 0) return items;
  return DEFAULT_LOVE_ITEMS.split(",").map((item) => item.trim());
}

export function serializeLoveItems(raw?: string | null): string {
  return parseLoveItems(raw).join(", ");
}
