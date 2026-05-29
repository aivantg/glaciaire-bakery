"use client";

import type { MenuItem } from "@/lib/store";
import { availableAddons } from "@/lib/order-display";
import { formatPrice } from "@/lib/format";
import { AddonSelector } from "@/components/order/AddonSelector";

type OrderMenuItemProps = {
  item: MenuItem;
  color: string;
  totalQty: number;
  selectedAddonIds: string[];
  onAdd: (item: MenuItem, addonIds: string[]) => void;
  onRemove: (item: MenuItem) => void;
  onToggleAddon: (itemId: string, addonId: string) => void;
};

export function OrderMenuItem({
  item,
  color,
  totalQty,
  selectedAddonIds,
  onAdd,
  onRemove,
  onToggleAddon,
}: OrderMenuItemProps) {
  const addons = availableAddons(item);

  return (
    <li className="py-5 sm:py-6">
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
          {totalQty > 0 && (
            <>
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="counter-btn"
                aria-label={`remove last ${item.name} added`}
              >
                −
              </button>
              <span
                className="w-5 text-center font-bold text-ink-900"
                aria-live="polite"
              >
                {totalQty}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={() => onAdd(item, selectedAddonIds)}
            className="counter-btn"
            style={{ color }}
            aria-label={`add ${item.name}`}
          >
            +
          </button>
        </div>
      </div>
      <AddonSelector
        itemId={item.id}
        addons={addons}
        selectedAddonIds={selectedAddonIds}
        color={color}
        onToggle={onToggleAddon}
      />
    </li>
  );
}
