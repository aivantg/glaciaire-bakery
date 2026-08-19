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
  decoratorSrc?: string | null;
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
  decoratorSrc,
  dimmed = false,
  onToggleAvailable,
  onEdit,
  archiveAction,
}: AdminMenuItemRowProps) {
  return (
    <li
      className={`py-5 sm:flex sm:items-center sm:justify-between sm:gap-4 ${
        dimmed || !item.available ? "opacity-50" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {decoratorSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={decoratorSrc}
            alt=""
            className="h-12 w-12 shrink-0 object-contain"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-sans text-lg font-extrabold text-ink-900">
                  {item.name}
                </span>
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-ink-400">
                  {CATEGORY_LABEL[item.category]}
                </span>
                {!item.available && onToggleAvailable && (
                  <span className="font-sans text-xs font-bold uppercase tracking-widest text-ink-400">
                    sold out
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 font-sans font-semibold tabular-nums text-ink-800">
              ${formatPrice(item.price)}
            </div>
          </div>
          {item.description && (
            <p className="mt-1 font-sans text-sm text-ink-400">
              {item.description}
            </p>
          )}
          <AdminAddonPreview addons={item.addons} />
          <p className="mt-1 font-mono text-xs text-ink-400">
            {formatUnitsOrdered(orderCount)}
          </p>
        </div>
      </div>
      {(onToggleAvailable || onEdit || archiveAction) && (
        <div
          className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mt-0 sm:shrink-0 sm:pl-0 ${
            decoratorSrc ? "pl-[3.75rem]" : ""
          }`}
        >
          {onToggleAvailable && (
            <button
              type="button"
              onClick={() => onToggleAvailable(item)}
              className="link-mono text-ink-600"
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
