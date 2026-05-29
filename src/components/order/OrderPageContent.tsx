"use client";

import { useState, useEffect, useCallback } from "react";
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
import { OrderMenuSection } from "@/components/order/OrderMenuSection";
import { CustomerNameField } from "@/components/order/CustomerNameField";
import { OrderFooterActions } from "@/components/order/OrderFooterActions";
import { ReviewOrderModal } from "@/components/order/ReviewOrderModal";
import { VenmoPaymentModal } from "@/components/order/VenmoPaymentModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";

type Stage = "browse" | "review";

export function OrderPageContent() {
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
      const res = await fetch("/api/menu");
      if (!res.ok) throw new Error("Failed to load menu");
      const data: MenuItem[] = await res.json();
      setMenuItems(data.filter((item) => item.available));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  function getAddonIdsForItem(itemId: string): string[] {
    return activeAddonIds[itemId] ?? [];
  }

  function addOne(item: MenuItem, addonIds: string[]) {
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
    if (!trimmedName) {
      setSubmitError("Please tell us your name.");
      return;
    }
    setStage("review");
  }

  async function placeOrder() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
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
    router.push("/orders");
  }

  let colorIdx = 0;
  const sections = SECTION_ORDER.map((cat) => {
    const items = menuItems.filter((m) => m.category === cat);
    const decorated = items.map((item) => ({
      item,
      color: colorForIndex(colorIdx++),
    }));
    return { category: cat, items: decorated };
  }).filter((s) => s.items.length > 0);

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-7xl sm:text-9xl md:text-[12rem] lg:text-[14rem] leading-[0.86] tracking-tighter">
        menu
      </h1>

      <p className="mt-6 sm:mt-10 font-sans font-bold text-ink-900 text-base sm:text-lg max-w-md">
        Pastry + cafe pop-up <br className="sm:hidden" />
        <span className="text-ink-400 font-medium">
          — open whenever the oven&apos;s on.
        </span>
      </p>

      {loading ? (
        <LoadingState message="loading menu…" className="mt-14" />
      ) : error ? (
        <ErrorState message={error} className="mt-14" />
      ) : menuItems.length === 0 ? (
        <EmptyState
          message="no goodies right now — check back soon!"
          className="mt-14"
        />
      ) : (
        <form onSubmit={goToReview}>
          {sections.map(({ category, items }) => (
            <OrderMenuSection
              key={category}
              category={category}
              items={items}
              getAddonIdsForItem={getAddonIdsForItem}
              totalQtyForMenuItem={totalQtyForMenuItem}
              onAdd={addOne}
              onRemove={removeMostRecent}
              onToggleAddon={toggleAddonSelection}
            />
          ))}

          {totalCount > 0 && (
            <CustomerNameField
              value={customerName}
              onChange={setCustomerName}
            />
          )}

          {submitError && (
            <p className="font-sans text-red-500 text-center mt-6">
              {submitError}
            </p>
          )}

          <OrderFooterActions
            totalCount={totalCount}
            total={total}
            hasItems={cartItems.length > 0}
            onViewQueue={() => router.push("/orders")}
          />
        </form>
      )}

      {stage === "review" && (
        <ReviewOrderModal
          items={cartItems}
          total={total}
          customerName={trimmedName}
          submitting={submitting}
          error={submitError}
          onConfirm={placeOrder}
          onEdit={() => {
            setStage("browse");
            setSubmitError(null);
          }}
        />
      )}

      {venmoAmount !== null && (
        <VenmoPaymentModal amountCents={venmoAmount} onClose={closeVenmoPopup} />
      )}
    </div>
  );
}
