"use client";

import {
  addonSublistClass,
  lineUnitPrice,
  makeCartKey,
  type CartLine,
} from "@/lib/order-display";
import { formatPrice } from "@/lib/format";
import { ModalShell } from "@/components/shared/ModalShell";

type ReviewOrderModalProps = {
  items: CartLine[];
  total: number;
  customerName: string;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
  onEdit: () => void;
};

export function ReviewOrderModal({
  items,
  total,
  customerName,
  submitting,
  error,
  onConfirm,
  onEdit,
}: ReviewOrderModalProps) {
  return (
    <ModalShell
      titleId="review-popup-title"
      onBackdropClick={submitting ? undefined : onEdit}
    >
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
          const unit = lineUnitPrice(menuItem, addonIds);
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
                  <ul className={addonSublistClass}>
                    {selectedAddons.map((addon) => (
                      <li key={addon!.id}>
                        <span className="text-ink-400">+ </span>
                        {addon!.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <span className="text-ink-800 font-semibold shrink-0">
                ${formatPrice(unit * quantity)}
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
    </ModalShell>
  );
}
