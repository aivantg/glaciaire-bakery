import type { MenuCategory } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export function parsePriceToCents(value: string): number {
  return Math.round(parseFloat(value) * 100);
}

export interface AddonFormRow {
  name: string;
  price: string;
  available: boolean;
}

export interface MenuItemFormState {
  name: string;
  description: string;
  price: string;
  available: boolean;
  category: MenuCategory;
  addons: AddonFormRow[];
}

export const EMPTY_MENU_FORM: MenuItemFormState = {
  name: "",
  description: "",
  price: "",
  available: true,
  category: "pastries",
  addons: [],
};

export function menuItemToFormState(item: {
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: MenuCategory;
  addons: { name: string; price: number | null; available: boolean }[];
}): MenuItemFormState {
  return {
    name: item.name,
    description: item.description,
    price: formatPrice(item.price),
    available: item.available,
    category: item.category,
    addons: item.addons.map((a) => ({
      name: a.name,
      price: a.price != null && a.price > 0 ? formatPrice(a.price) : "",
      available: a.available,
    })),
  };
}

export const underlineInputClass =
  "w-full bg-transparent border-0 border-b border-ink-400/40 focus:border-ink-900 focus:outline-none font-sans text-ink-900 placeholder-ink-300 py-2";
