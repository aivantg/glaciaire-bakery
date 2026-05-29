"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { MenuItem, MenuCategory } from "@/lib/store";
import { Squiggle } from "@/components/Squiggle";
import venmoQr from "@/app/venmo.png";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  addonIds: string[];
}

function makeCartKey(menuItemId: string, addonIds: string[]): string {
  return `${menuItemId}:${[...addonIds].sort().join(",")}`;
}

function lineUnitPrice(menuItem: MenuItem, addonIds: string[]): number {
  const addonTotal = addonIds.reduce((sum, id) => {
    const addon = menuItem.addons.find((a) => a.id === id);
    return sum + (addon?.price ?? 0);
  }, 0);
  return menuItem.price + addonTotal;
}

function availableAddons(menuItem: MenuItem) {
  return menuItem.addons.filter((a) => a.available);
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

const SECTION_ORDER: MenuCategory[] = ["cafe", "pastries"];
const SECTION_LABEL: Record<MenuCategory, string> = {
  cafe: "cafe",
  pastries: "pastries",
};

interface VenmoPopupState {
  amount: number; // cents
}

type Stage = "browse" | "review";

export default function OrderPage() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [activeAddonIds, setActiveAddonIds] = useState<
    Record<string, string[]>
  >({});
  const [customerName, setCustomerName] = useState("");
  const [stage, setStage] = useState<Stage>("browse");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  function getAddonIdsForItem(itemId: string): string[] {
    return activeAddonIds[itemId] ?? [];
  }

  function setQuantity(item: MenuItem, addonIds: string[], qty: number) {
    const key = makeCartKey(item.id, addonIds);
    setCart((prev) => {
      const next = new Map(prev);
      if (qty <= 0) {
        next.delete(key);
      } else {
        next.set(key, { menuItem: item, quantity: qty, addonIds });
      }
      return next;
    });
  }

  function toggleAddon(item: MenuItem, addonId: string, checked: boolean) {
    const currentIds = getAddonIdsForItem(item.id);
    const nextIds = checked
      ? [...currentIds, addonId]
      : currentIds.filter((id) => id !== addonId);
    const oldKey = makeCartKey(item.id, currentIds);
    const newKey = makeCartKey(item.id, nextIds);

    setActiveAddonIds((prev) => ({ ...prev, [item.id]: nextIds }));
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(oldKey);
      if (!existing) return next;
      next.delete(oldKey);
      const merged = next.get(newKey);
      next.set(newKey, {
        menuItem: item,
        quantity: (merged?.quantity ?? 0) + existing.quantity,
        addonIds: nextIds,
      });
      return next;
    });
  }

  const cartItems = Array.from(cart.values());
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

      setVenmoPopup({ amount: total });
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

  // Items grouped by category, preserving createdAt order within each group.
  // We track a single running color index so colors aren't repeated across sections.
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

      {/* Menu list */}
      {loading ? (
        <div className="text-center py-12 font-sans text-ink-400 mt-14">
          loading menu…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 mt-14">{error}</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12 font-sans text-ink-400 mt-14">
          no goodies right now — check back soon!
        </div>
      ) : (
        <form onSubmit={goToReview}>
          {sections.map(({ category, items }) => (
            <div key={category} className="mt-14">
              <div className="section-row">
                <span className="label">{SECTION_LABEL[category]}</span>
                <Squiggle className="flex-1 h-6" />
              </div>

              <ul className="list-hairline mt-2">
                {items.map(({ item, color }) => {
                  const selectedAddonIds = getAddonIdsForItem(item.id);
                  const cartKey = makeCartKey(item.id, selectedAddonIds);
                  const qty = cart.get(cartKey)?.quantity ?? 0;
                  const addons = availableAddons(item);
                  return (
                    <li key={item.id} className="py-5 sm:py-6">
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-sans font-extrabold text-xl sm:text-3xl tracking-tight break-words"
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
                        <div className="flex items-center gap-1 sm:gap-3 shrink-0 font-sans">
                          {qty > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setQuantity(item, selectedAddonIds, qty - 1)
                                }
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
                            onClick={() =>
                              setQuantity(item, selectedAddonIds, qty + 1)
                            }
                            className="counter-btn"
                            style={{ color }}
                            aria-label={`add ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {qty > 0 && addons.length > 0 && (
                        <ul className="mt-3 ml-2 space-y-2 border-l-2 border-ink-400/30 pl-4">
                          {addons.map((addon) => (
                            <li key={addon.id}>
                              <label className="flex items-center gap-2 font-sans text-sm text-ink-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedAddonIds.includes(addon.id)}
                                  onChange={(e) =>
                                    toggleAddon(
                                      item,
                                      addon.id,
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 accent-ink-900"
                                />
                                <span>
                                  {addon.name}{" "}
                                  <span className="text-ink-400">
                                    +${formatPrice(addon.price)}
                                  </span>
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Name input (only after picking something) */}
          {totalCount > 0 && (
            <div className="mt-10 max-w-sm mx-auto">
              <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-2 text-center">
                your name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="who's this for?"
                required
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
              disabled={cartItems.length === 0}
              className="btn-dark"
            >
              {totalCount === 0
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

      {stage === "review" && (
        <ReviewPopup
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

      {venmoPopup && (
        <VenmoPopup popup={venmoPopup} onClose={closeVenmoPopup} />
      )}
    </div>
  );
}

interface ReviewPopupProps {
  items: CartItem[];
  total: number;
  customerName: string;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onEdit: () => void;
}

function ReviewPopup({
  items,
  total,
  customerName,
  submitting,
  error,
  onConfirm,
  onEdit,
}: ReviewPopupProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-popup-title"
      onClick={submitting ? undefined : onEdit}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="brand-presents text-sm sm:text-base text-center">
          one more look —
        </p>
        <h2
          id="review-popup-title"
          className="hero-stack text-[12vw] sm:text-5xl text-center mt-1"
        >
          review order
        </h2>

        <div className="mt-5 text-center">
          <div className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
            for
          </div>
          <div className="font-sans font-black text-2xl sm:text-3xl text-ink-900 mt-1">
            {customerName}
          </div>
        </div>

        <ul className="list-hairline mt-5">
          {items.map(({ menuItem, quantity, addonIds }) => {
            const key = makeCartKey(menuItem.id, addonIds);
            const selectedAddons = addonIds
              .map((id) => menuItem.addons.find((a) => a.id === id))
              .filter(Boolean);
            return (
              <li
                key={key}
                className="py-3 flex items-start justify-between gap-3 font-sans"
              >
                <div>
                  <span className="text-ink-900 font-semibold">
                    {quantity}× {menuItem.name}
                  </span>
                  {selectedAddons.length > 0 && (
                    <ul className="mt-1 text-sm text-ink-500 space-y-0.5">
                      {selectedAddons.map((addon) => (
                        <li key={addon!.id}>+ {addon!.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className="text-ink-800 font-semibold shrink-0">
                  $
                  {formatPrice(
                    lineUnitPrice(menuItem, addonIds) * quantity
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="row-hairline py-3 mt-1 flex items-center justify-between font-sans">
          <span className="text-xs tracking-widest uppercase font-bold text-ink-600">
            total
          </span>
          <span className="font-black text-2xl text-ink-900">
            ${formatPrice(total)}
          </span>
        </div>

        {error && (
          <p className="font-sans text-red-500 text-center mt-4">{error}</p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="btn-dark"
          >
            {submitting ? "placing order…" : "place order"}
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={submitting}
            className="link-mono"
          >
            edit order
          </button>
        </div>
      </div>
    </div>
  );
}

interface VenmoPopupProps {
  popup: VenmoPopupState;
  onClose: () => void;
}

function VenmoPopup({ popup, onClose }: VenmoPopupProps) {
  const amountStr = formatPrice(popup.amount);

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
          scan to pay
        </h2>

        <div className="mt-5 text-center">
          <div className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
            total
          </div>
          <div className="font-sans font-black text-4xl sm:text-5xl text-ink-900 mt-1 tracking-tight">
            ${amountStr}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <div className="bg-white p-3 rounded-2xl border-2 border-ink-900">
            <Image
              src={venmoQr}
              alt="Venmo QR code"
              width={208}
              height={208}
              className="block"
              priority
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button type="button" onClick={onClose} className="btn-dark">
            done — view queue →
          </button>
        </div>
      </div>
    </div>
  );
}
