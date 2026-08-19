"use client";

import type { MenuItem } from "@/lib/store";
import { AdminMenuItemRow } from "@/components/menu-admin/AdminMenuItemRow";
import type { useConfirmAction } from "@/hooks/useConfirmAction";
import type { PopupDecorator } from "@/lib/decorator-src";

type AdminMenuListProps = {
  items: MenuItem[];
  orderCounts: Record<string, number>;
  decorators?: PopupDecorator[];
  archiving: string | null;
  confirm: ReturnType<typeof useConfirmAction>;
  onToggleAvailable: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onArchive: (id: string) => void;
};

export function AdminMenuList({
  items,
  orderCounts,
  decorators = [],
  archiving,
  confirm,
  onToggleAvailable,
  onEdit,
  onArchive,
}: AdminMenuListProps) {
  return (
    <ul className="list-hairline mt-10">
      {items.map((item) => (
        <AdminMenuItemRow
          key={item.id}
          item={item}
          decoratorSrc={
            decorators.find((d) => d.id === item.decorator)?.src ?? null
          }
          orderCount={orderCounts[item.id] ?? 0}
          onToggleAvailable={onToggleAvailable}
          onEdit={onEdit}
          archiveAction={{
            actionKey: `${item.id}:archive`,
            label: "archive",
            onConfirm: () => onArchive(item.id),
            disabled: archiving === item.id,
            confirm,
          }}
        />
      ))}
    </ul>
  );
}
