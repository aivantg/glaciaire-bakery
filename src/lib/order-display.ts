import type { MenuItem } from "@/lib/store";
import type { OrderItem } from "@/lib/store";

export function makeCartKey(menuItemId: string, addonIds: string[]): string {
  return `${menuItemId}:${[...addonIds].sort().join(",")}`;
}

export function lineUnitPrice(menuItem: MenuItem, addonIds: string[]): number {
  const addonTotal = addonIds.reduce((sum, id) => {
    const addon = menuItem.addons.find((a) => a.id === id);
    return sum + (addon?.price ?? 0);
  }, 0);
  return menuItem.price + addonTotal;
}

export function availableAddons(menuItem: MenuItem) {
  return menuItem.addons.filter((a) => a.available);
}

/** Hide price on menu chips when unset or free. Returns e.g. "$0.50" (no leading +). */
export function formatAddonPrice(cents: number | null): string | null {
  if (cents == null || cents <= 0) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

export const addonSublistClass =
  "mt-1 text-sm text-ink-500 space-y-0.5 font-sans";

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
  addonIds: string[];
}

/** One row per distinct add-on configuration (for review / queue-style lists). */
export function cartLinesForDisplay(lines: CartLine[]): CartLine[] {
  return lines.map((line) => ({ ...line }));
}

export interface OrderLineDisplay {
  menuItemName: string;
  quantity: number;
  unitPrice: number; // base, cents
  addons: { name: string; unitPrice: number }[];
  lineTotalCents: number;
}

export function orderItemsForDisplay(items: OrderItem[]): OrderLineDisplay[] {
  return items.map((item) => {
    const addonTotal = item.addons.reduce((sum, a) => sum + a.unitPrice, 0);
    return {
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      addons: item.addons,
      lineTotalCents: (item.unitPrice + addonTotal) * item.quantity,
    };
  });
}

export function addonNamesForIds(
  menuItem: MenuItem,
  addonIds: string[]
): string[] {
  return addonIds
    .map((id) => menuItem.addons.find((a) => a.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}
