"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/store";
import { Squiggle } from "@/components/Squiggle";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// Per-item ink colors — keep the playful color-coded names from the prior design.
const ITEM_COLORS = [
  "#5a3a1a", // brown
  "#d97a3a", // orange
  "#ff8fb3", // pink
  "#e85a3a", // coral
  "#e09d28", // yellow
  "#a87827", // mustard
  "#7a4dc7", // purple
  "#3d7348", // green
];

function colorForIndex(i: number) {
  return ITEM_COLORS[i % ITEM_COLORS.length];
}

interface VenmoPopupState {
  handle: string;
  amount: number; // cents
  customerName: string;
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
  const [venmoHandle, setVenmoHandle] = useState("");
  const [venmoPopup, setVenmoPopup] = useState<VenmoPopupState | null>(null);

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

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.venmoHandle === "string") setVenmoHandle(d.venmoHandle);
      })
      .catch(() => {});
  }, []);

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
  const totalCount = cartItems.reduce((sum, { quantity }) => sum + quantity, 0);
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

      setVenmoPopup({
        handle: venmoHandle,
        amount: total,
        customerName: customerName.trim(),
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function closeVenmoPopup() {
    setVenmoPopup(null);
    router.push("/orders");
  }

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-[18vw] sm:text-[14rem] leading-[0.86] tracking-tighter">
        menu
      </h1>

      <p className="mt-8 sm:mt-10 font-sans font-bold text-ink-900 text-base sm:text-lg max-w-md">
        Pastry + cafe pop-up <br className="sm:hidden" />
        <span className="text-ink-400 font-medium">
          — open whenever the oven&apos;s on.
        </span>
      </p>

      {/* Section divider */}
      <div className="mt-14 section-row">
        <span className="label">drinks &amp; bakes</span>
        <Squiggle className="flex-1 h-6" />
      </div>

      {/* Menu list */}
      {loading ? (
        <div className="text-center py-12 font-sans text-ink-400">
          loading menu…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12 font-sans text-ink-400">
          no goodies right now — check back soon!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <ul className="list-hairline mt-2">
            {menuItems.map((item, idx) => {
              const qty = getQuantity(item.id);
              const color = colorForIndex(idx);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-6"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight"
                      style={{ color }}
                    >
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="font-sans text-sm text-ink-400 mt-1 max-w-md">
                        {item.description}
                      </div>
                    )}
                    <div className="font-sans font-semibold text-sm text-ink-800 mt-1">
                      ${formatPrice(item.price)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-sans">
                    {qty > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setQuantity(item, qty - 1)}
                          className="counter-btn"
                          aria-label={`decrease ${item.name}`}
                        >
                          −
                        </button>
                        <span
                          className="w-5 text-center font-bold text-ink-900"
                          aria-live="polite"
                        >
                          {qty}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setQuantity(item, qty + 1)}
                      className="counter-btn"
                      style={{ color }}
                      aria-label={`add ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Name input (only after picking something) */}
          {totalCount > 0 && (
            <div className="mt-10 max-w-sm mx-auto">
              <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-2 text-center">
                your name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="who's this for?"
                className="w-full bg-transparent border-0 border-b border-ink-400/40 focus:border-ink-900 focus:outline-none font-sans text-center text-ink-900 placeholder-ink-300 py-2"
              />
            </div>
          )}

          {submitError && (
            <p className="font-sans text-red-500 text-center mt-6">
              {submitError}
            </p>
          )}

          {/* CTA + view queue */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={submitting || cartItems.length === 0}
              className="btn-dark"
            >
              {submitting
                ? "placing order…"
                : totalCount === 0
                ? "add something tasty"
                : `review order (${totalCount}) — $${formatPrice(total)}`}
            </button>
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="link-mono"
            >
              view queue →
            </button>
          </div>
        </form>
      )}

      {venmoPopup && (
        <VenmoPopup popup={venmoPopup} onClose={closeVenmoPopup} />
      )}
    </div>
  );
}

interface VenmoPopupProps {
  popup: VenmoPopupState;
  onClose: () => void;
}

function VenmoPopup({ popup, onClose }: VenmoPopupProps) {
  const { handle, amount, customerName } = popup;
  const amountStr = formatPrice(amount);
  const hasHandle = handle.length > 0;
  const note = customerName
    ? `Glaciare order — ${customerName}`
    : "Glaciare order";
  // Venmo deep link: opens the app on mobile, falls back to the web profile.
  const venmoUrl = hasHandle
    ? `https://venmo.com/${encodeURIComponent(
        handle
      )}?txn=pay&amount=${amountStr}&note=${encodeURIComponent(note)}`
    : null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venmo-popup-title"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="brand-presents text-sm sm:text-base text-center">
          order placed —
        </p>
        <h2
          id="venmo-popup-title"
          className="hero-stack text-[14vw] sm:text-6xl text-center mt-1"
        >
          {hasHandle ? "pay with venmo" : "thanks!"}
        </h2>

        <div className="mt-6 text-center">
          <div className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
            {hasHandle ? "send" : "total"}
          </div>
          <div className="font-sans font-black text-4xl sm:text-5xl text-ink-900 mt-1 tracking-tight">
            ${amountStr}
          </div>
        </div>

        {hasHandle && venmoUrl && (
          <div className="mt-5 text-center">
            <div className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
              to
            </div>
            <a
              href={venmoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="venmo-handle text-3xl sm:text-4xl mt-1 inline-block hover:underline"
            >
              @{handle}
            </a>
          </div>
        )}

        <div className="row-hairline py-4 mt-6 text-center">
          <p className="font-sans font-bold text-ink-900 text-base leading-snug">
            please venmo the host
            <br />
            <span className="text-ink-400 font-medium">
              and show the confirmation when you receive your item.
            </span>
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          {hasHandle && venmoUrl ? (
            <a
              href={venmoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-dark"
            >
              open venmo
            </a>
          ) : (
            <button type="button" onClick={onClose} className="btn-dark">
              got it
            </button>
          )}
          <button type="button" onClick={onClose} className="link-mono">
            done — view queue →
          </button>
        </div>
      </div>
    </div>
  );
}
