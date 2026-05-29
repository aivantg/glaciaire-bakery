"use client";

import type { MenuItem } from "@/lib/store";
import { AdminMenuItemRow } from "@/components/menu-admin/AdminMenuItemRow";
import type { useConfirmAction } from "@/hooks/useConfirmAction";

type ArchivedMenuSectionProps = {
  items: MenuItem[];
  orderCounts: Record<string, number>;
  unarchiving: string | null;
  confirm: ReturnType<typeof useConfirmAction>;
  onUnarchive: (id: string) => void;
};

export function ArchivedMenuSection({
  items,
  orderCounts,
  unarchiving,
  confirm,
  onUnarchive,
}: ArchivedMenuSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-14 sm:mt-16">
      <h2 className="font-sans font-black text-2xl text-ink-900">
        archived items
      </h2>
      <p className="mt-2 font-sans text-sm text-ink-500">
        hidden from the menu — unarchive to bring back.
      </p>
      <ul className="list-hairline mt-6">
        {items.map((item) => (
          <AdminMenuItemRow
            key={item.id}
            item={item}
            orderCount={orderCounts[item.id] ?? 0}
            dimmed
            archiveAction={{
              actionKey: `${item.id}:unarchive`,
              label: "unarchive",
              onConfirm: () => onUnarchive(item.id),
              disabled: unarchiving === item.id,
              confirm,
            }}
          />
        ))}
      </ul>
    </section>
  );
}
