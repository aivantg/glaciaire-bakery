import type { MenuCategory, MenuItemAddonInput } from "./store";

export const VALID_CATEGORIES: MenuCategory[] = ["cafe", "pastries"];

export function parseAddons(body: unknown): MenuItemAddonInput[] | undefined {
  if (body === undefined) return undefined;
  if (!Array.isArray(body)) return undefined;
  const addons: MenuItemAddonInput[] = [];
  for (const raw of body) {
    if (!raw || typeof raw !== "object") continue;
    const { name, price, available } = raw as Record<string, unknown>;
    if (typeof name !== "string" || name.trim() === "") continue;
    let cents: number | null = null;
    if (typeof price === "number" && !Number.isNaN(price) && price >= 0) {
      cents = Math.round(price);
    }
    addons.push({
      name: name.trim(),
      price: cents,
      available: available !== false,
    });
  }
  return addons;
}
