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

  // Cart: menuItemId -> CartItem
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
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
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order failed");

      // Success — redirect to orders page
      router.push("/orders");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-bakery-800 mb-6">Place an Order</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading menu…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No items available right now. Check back soon!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Menu items */}
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              Select Items
            </h2>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className={`bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm transition-all ${
                      qty > 0 ? "border-bakery-400 ring-1 ring-bakery-300" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-bakery-700 shrink-0">
                      ${formatPrice(item.price)}
                    </div>
                    {/* Quantity selector */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity(item, qty - 1)}
                        disabled={qty === 0}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-30 font-bold transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-medium">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item, qty + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-bakery-400 bg-bakery-50 hover:bg-bakery-100 font-bold text-bakery-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Customer info */}
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-base font-semibold text-gray-700">
              Order Details (optional)
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bakery-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, special requests…"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bakery-400 resize-none"
              />
            </div>
          </section>

          {/* Order summary */}
          {cartItems.length > 0 && (
            <section className="bg-bakery-50 border border-bakery-200 rounded-xl p-4">
              <h2 className="text-base font-semibold text-bakery-800 mb-2">
                Summary
              </h2>
              <ul className="space-y-1 text-sm text-gray-700 mb-3">
                {cartItems.map(({ menuItem, quantity }) => (
                  <li key={menuItem.id} className="flex justify-between">
                    <span>
                      {menuItem.name} × {quantity}
                    </span>
                    <span>${formatPrice(menuItem.price * quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-bakery-200 pt-2 flex justify-between font-semibold text-bakery-800">
                <span>Total</span>
                <span>${formatPrice(total)}</span>
              </div>
            </section>
          )}

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting || cartItems.length === 0}
            className="w-full py-3 bg-bakery-600 hover:bg-bakery-700 disabled:opacity-50 text-white rounded-xl font-semibold text-base transition-colors"
          >
            {submitting ? "Placing order…" : `Place Order${total > 0 ? ` — $${formatPrice(total)}` : ""}`}
          </button>
        </form>
      )}
    </div>
  );
}
