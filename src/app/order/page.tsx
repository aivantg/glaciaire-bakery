"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/store";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export default function OrderPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  function setQuantity(item: MenuItem, qty: number) {
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, { menuItem: item, quantity: qty });
      }
      return next;
    });
  }

  function getQuantity(id: string): number {
    return cart.get(id)?.quantity ?? 0;
  }

  const cartItems = Array.from(cart.values());
  const total = cartItems.reduce(
    (sum, { menuItem, quantity }) => sum + menuItem.price * quantity,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) {
      setSubmitError("Add at least one item to your order.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(({ menuItem, quantity }) => ({
            menuItemId: menuItem.id,
            quantity,
          })),
          customerName: customerName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order failed");

      router.push("/orders");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-bakery-800 mb-6">Place an Order 🧁</h1>

      {loading ? (
        <div className="text-center py-12 text-bakery-400">Loading menu…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12 text-bakery-300">
          No items available right now. Check back soon! 🌸
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Menu items */}
          <div className="space-y-2">
            {menuItems.map((item) => {
              const qty = getQuantity(item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white border-2 rounded-2xl p-4 flex items-center gap-4 shadow-sm transition-all ${
                    qty > 0
                      ? "border-bakery-300 bg-bakery-50"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-gray-400 mt-0.5">
                        {item.description}
                      </div>
                    )}
                    <div className="text-sm font-medium text-bakery-600 mt-1">
                      ${formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {qty > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setQuantity(item, qty - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-bakery-200 text-bakery-600 hover:bg-bakery-100 font-bold transition-colors"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-semibold text-bakery-700">
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setQuantity(item, qty + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-bakery-500 hover:bg-bakery-600 text-white text-xl font-bold shadow-sm transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-transparent focus-within:border-bakery-200 transition-colors">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
            />
          </div>

          {/* Order summary */}
          {cartItems.length > 0 && (
            <div className="bg-bakery-100 rounded-2xl p-4">
              <ul className="space-y-1 text-sm text-gray-700 mb-3">
                {cartItems.map(({ menuItem, quantity }) => (
                  <li key={menuItem.id} className="flex justify-between">
                    <span>
                      {menuItem.name} × {quantity}
                    </span>
                    <span className="font-medium">
                      ${formatPrice(menuItem.price * quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-bakery-200 pt-2 flex justify-between font-semibold text-bakery-800">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
              </div>
            </div>
          )}

          {submitError && (
            <p className="text-sm text-red-500">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || cartItems.length === 0}
            className="w-full py-3 bg-bakery-500 hover:bg-bakery-600 disabled:opacity-40 text-white rounded-2xl font-semibold text-base shadow-sm transition-colors"
          >
            {submitting
              ? "Placing order…"
              : `Place Order${total > 0 ? ` — $${formatPrice(total)}` : ""}`}
          </button>
        </form>
      )}
    </div>
  );
}
