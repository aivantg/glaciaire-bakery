"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/store";
import {
  cartLinesForDisplay,
  lineUnitPrice,
  makeCartKey,
  type CartLine,
} from "@/lib/order-display";
import { SECTION_ORDER } from "@/lib/menu-labels";
import { colorForIndex } from "@/components/order/constants";
import { popupApiBase } from "@/lib/popups";

type Stage = "browse" | "review";

export type OrderPageSection = {
  category: (typeof SECTION_ORDER)[number];
  items: { item: MenuItem; color: string }[];
};

export function useOrderPage({
  slug,
  ordersPath,
}: {
  slug: string;
  ordersPath: string;
}) {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
  const [addHistory, setAddHistory] = useState<Record<string, string[]>>({});
  const [activeAddonIds, setActiveAddonIds] = useState<
    Record<string, string[]>
  >({});
  const [customerName, setCustomerName] = useState("");
  const [stage, setStage] = useState<Stage>("browse");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [venmoAmount, setVenmoAmount] = useState<number | null>(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${popupApiBase(slug)}/menu`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load menu");
      const data: MenuItem[] = await res.json();
      setMenuItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  function getAddonIdsForItem(itemId: string): string[] {
    return activeAddonIds[itemId] ?? [];
  }

  function addOne(item: MenuItem, addonIds: string[]) {
    if (!item.available) return;
    const key = makeCartKey(item.id, addonIds);
    setAddHistory((prev) => ({
      ...prev,
      [item.id]: [...(prev[item.id] ?? []), key],
    }));
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      next.set(key, {
        menuItem: item,
        quantity: (existing?.quantity ?? 0) + 1,
        addonIds,
      });
      return next;
    });
  }

  function removeMostRecent(item: MenuItem) {
    const history = addHistory[item.id];
    if (!history?.length) return;

    const key = history[history.length - 1];
    setAddHistory((prev) => ({
      ...prev,
      [item.id]: prev[item.id]?.slice(0, -1) ?? [],
    }));
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (!existing) return next;
      if (existing.quantity <= 1) {
        next.delete(key);
      } else {
        next.set(key, { ...existing, quantity: existing.quantity - 1 });
      }
      return next;
    });
  }

  function toggleAddonSelection(itemId: string, addonId: string) {
    const menuItem = menuItems.find((m) => m.id === itemId);
    if (menuItem && !menuItem.available) return;
    setActiveAddonIds((prev) => {
      const current = prev[itemId] ?? [];
      const next = current.includes(addonId)
        ? current.filter((id) => id !== addonId)
        : [...current, addonId];
      return { ...prev, [itemId]: next };
    });
  }

  function totalQtyForMenuItem(itemId: string): number {
    return Array.from(cart.values())
      .filter((line) => line.menuItem.id === itemId)
      .reduce((sum, line) => sum + line.quantity, 0);
  }

  const cartItems = cartLinesForDisplay(Array.from(cart.values()));
  const totalCount = cartItems.reduce((sum, { quantity }) => sum + quantity, 0);
  const total = cartItems.reduce(
    (sum, { menuItem, quantity, addonIds }) =>
      sum + lineUnitPrice(menuItem, addonIds) * quantity,
    0
  );
  const trimmedName = customerName.trim();

  function goToReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (cartItems.length === 0) {
      setSubmitError("Add at least one item to your order.");
      return;
    }
    setStage("review");
  }

  async function placeOrder() {
    setSubmitError(null);
    if (!trimmedName) {
      setSubmitError("Please tell us your name.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${popupApiBase(slug)}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(({ menuItem, quantity, addonIds }) => ({
            menuItemId: menuItem.id,
            quantity,
            addonIds,
          })),
          customerName: trimmedName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order failed");

      setVenmoAmount(total);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function closeVenmoPopup() {
    setVenmoAmount(null);
    router.push(ordersPath);
  }

  let colorIdx = 0;
  const sections: OrderPageSection[] = SECTION_ORDER.map((cat) => {
    const items = menuItems.filter((m) => m.category === cat);
    const decorated = items.map((item) => ({
      item,
      color: colorForIndex(colorIdx++),
    }));
    return { category: cat, items: decorated };
  }).filter((s) => s.items.length > 0);

  return {
    menuItems,
    loading,
    error,
    customerName,
    setCustomerName,
    stage,
    setStage,
    submitting,
    submitError,
    setSubmitError,
    venmoAmount,
    cartItems,
    totalCount,
    total,
    trimmedName,
    sections,
    getAddonIdsForItem,
    addOne,
    removeMostRecent,
    toggleAddonSelection,
    totalQtyForMenuItem,
    goToReview,
    placeOrder,
    closeVenmoPopup,
    onViewQueue: () => router.push(ordersPath),
  };
}
