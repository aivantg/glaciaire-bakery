"use client";

import type { MenuItem } from "@/lib/store";
import { formatPrice, formatUnitsOrdered } from "@/lib/format";
import { CATEGORY_LABEL } from "@/lib/menu-labels";
import { AdminAddonPreview } from "@/components/menu-admin/AdminAddonPreview";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import type { useConfirmAction } from "@/hooks/useConfirmAction";

type AdminMenuItemRowProps = {
  item: MenuItem;
  orderCount: number;
  dimmed?: boolean;
  onToggleAvailable?: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  archiveAction?: {
    actionKey: string;
    label: string;
    onConfirm: () => void;
    disabled: boolean;
    confirm: ReturnType<typeof useConfirmAction>;
  };
};

export function AdminMenuItemRow({
  item,
  orderCount,
  dimmed = false,
  onToggleAvailable,
  onEdit,
  archiveAction,
}: AdminMenuItemRowProps) {
  return (
    <li
      className={`py-5 flex flex-wrap items-start sm:items-center justify-between gap-x-4 gap-y-3 ${
        dimmed || !item.available ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans font-extrabold text-lg text-ink-900 break-words">
            {item.name}
          </span>
          <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-400">
            {CATEGORY_LABEL[item.category]}
          </span>
          {!item.available && onToggleAvailable && (
            <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-400">
              sold out
            </span>
          )}
        </div>
        {item.description && (
          <p className="font-sans text-sm text-ink-400 mt-1">
            {item.description}
          </p>
        )}
        <AdminAddonPreview addons={item.addons} />
        <p className="font-mono text-xs text-ink-400 mt-1">
          {formatUnitsOrdered(orderCount)}
        </p>
      </div>
      <div className="font-sans font-semibold text-ink-800 shrink-0">
        ${formatPrice(item.price)}
      </div>
      {(onToggleAvailable || onEdit || archiveAction) && (
        <div className="flex items-center gap-4 sm:gap-5 shrink-0 ml-auto">
          {onToggleAvailable && (
            <button
              type="button"
              onClick={() => onToggleAvailable(item)}
              className="link-mono text-leaf-700"
            >
              {item.available ? "disable" : "enable"}
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="link-mono text-sky-500"
            >
              edit
            </button>
          )}
          {archiveAction && (
            <ConfirmActionButton
              actionKey={archiveAction.actionKey}
              label={archiveAction.label}
              onConfirm={archiveAction.onConfirm}
              disabled={archiveAction.disabled}
              confirm={archiveAction.confirm}
            />
          )}
        </div>
      )}
    </li>
  );
}
