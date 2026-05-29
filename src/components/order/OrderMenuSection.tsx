"use client";

import type { MenuCategory, MenuItem } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/menu-labels";
import { Squiggle } from "@/components/Squiggle";
import { OrderMenuItem } from "@/components/order/OrderMenuItem";

export type DecoratedMenuItem = {
  item: MenuItem;
  color: string;
};

type OrderMenuSectionProps = {
  category: MenuCategory;
  items: DecoratedMenuItem[];
  getAddonIdsForItem: (itemId: string) => string[];
  totalQtyForMenuItem: (itemId: string) => number;
  onAdd: (item: MenuItem, addonIds: string[]) => void;
  onRemove: (item: MenuItem) => void;
  onToggleAddon: (itemId: string, addonId: string) => void;
};

export function OrderMenuSection({
  category,
  items,
  getAddonIdsForItem,
  totalQtyForMenuItem,
  onAdd,
  onRemove,
  onToggleAddon,
}: OrderMenuSectionProps) {
  return (
    <div className="mt-14">
      <div className="section-row">
        <span className="label">{CATEGORY_LABEL[category]}</span>
        <Squiggle className="flex-1 h-6" />
      </div>

      <ul className="list-hairline mt-2">
        {items.map(({ item, color }) => (
          <OrderMenuItem
            key={item.id}
            item={item}
            color={color}
            totalQty={totalQtyForMenuItem(item.id)}
            selectedAddonIds={getAddonIdsForItem(item.id)}
            onAdd={onAdd}
            onRemove={onRemove}
            onToggleAddon={onToggleAddon}
          />
        ))}
      </ul>
    </div>
  );
}
