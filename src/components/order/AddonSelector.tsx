"use client";

import type { MenuItemAddon } from "@/lib/store";
import { formatAddonPrice } from "@/lib/order-display";

type AddonSelectorProps = {
  itemId: string;
  addons: MenuItemAddon[];
  selectedAddonIds: string[];
  color: string;
  onToggle: (itemId: string, addonId: string) => void;
};

export function AddonSelector({
  itemId,
  addons,
  selectedAddonIds,
  color,
  onToggle,
}: AddonSelectorProps) {
  if (addons.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {addons.map((addon) => {
        const selected = selectedAddonIds.includes(addon.id);
        const priceLabel = formatAddonPrice(addon.price);
        return (
          <button
            key={addon.id}
            type="button"
            onClick={() => onToggle(itemId, addon.id)}
            className="addon-chip"
            aria-pressed={selected}
            style={selected ? { backgroundColor: color } : undefined}
          >
            + {addon.name}
            {priceLabel && (
              <span
                className={selected ? "text-white/75" : "text-ink-400"}
              >
                {" "}
                {priceLabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
