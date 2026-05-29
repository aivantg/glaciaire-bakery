"use client";

import type { Order } from "@/lib/store";
import { addonSublistClass, orderItemsForDisplay } from "@/lib/order-display";
import { formatPrice, formatTime } from "@/lib/format";
import {
  ARCHIVED_STATUS_COLOR,
  STATUS_LABELS,
  STATUS_NEXT,
  STATUS_NEXT_LABEL,
  statusColor,
} from "@/lib/order-queue";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import type { useConfirmAction } from "@/hooks/useConfirmAction";

type OrderQueueRowProps = {
  order: Order;
  orderNumber: number;
  isNew: boolean;
  authenticated: boolean;
  updating: string | null;
  confirm: ReturnType<typeof useConfirmAction>;
  onAdvanceStatus: (order: Order) => void;
  onSetArchived: (orderId: string, archived: boolean) => void | Promise<void>;
  onDeleteOrder: (orderId: string) => void | Promise<void>;
};

export function OrderQueueRow({
  order,
  orderNumber,
  isNew,
  authenticated,
  updating,
  confirm,
  onAdvanceStatus,
  onSetArchived,
  onDeleteOrder,
}: OrderQueueRowProps) {
  const isDone = order.status === "done";
  const isArchived = order.archived;
  const isUpdating = updating === order.id;

  return (
    <li
      className={`py-5 sm:py-6 flex items-start justify-between gap-3 sm:gap-6 ${
        isNew ? "order-new" : ""
      }`}
    >
      <div
        className={`min-w-0 flex-1 ${isArchived ? "opacity-50" : ""}`}
      >
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono text-sm sm:text-base font-bold text-ink-400">
            #{orderNumber}
          </span>
          <span className="font-sans font-black text-lg sm:text-2xl text-ink-900 break-words">
            {order.customerName || "guest"}
          </span>
          {isNew && (
            <span className="new-badge font-sans text-xs tracking-widest uppercase font-bold text-bakery-500">
              new
            </span>
          )}
        </div>
        <ul className="mt-1 font-sans text-sm font-medium text-ink-800 space-y-2">
          {orderItemsForDisplay(order.items).map((line, i) => (
            <li key={i}>
              <div>
                {line.quantity}× {line.menuItemName}
                <span className="text-ink-400 font-normal">
                  {" "}
                  — ${formatPrice(line.lineTotalCents)}
                </span>
              </div>
              {line.addons.length > 0 && (
                <ul className={`ml-3 ${addonSublistClass} font-normal`}>
                  {line.addons.map((addon, j) => (
                    <li key={j}>
                      <span className="text-ink-400">+ </span>
                      {addon.name}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div className="font-mono text-xs text-ink-400 mt-1">
          {formatTime(order.createdAt)} · total ${formatPrice(order.total)}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="status-text"
          style={{
            color: isArchived ? ARCHIVED_STATUS_COLOR : statusColor(order.status),
          }}
        >
          {isArchived ? "archived" : STATUS_LABELS[order.status]}
        </span>
        {authenticated && isDone && !isArchived && (
          <ConfirmActionButton
            actionKey={`${order.id}:archive`}
            label="archive"
            onConfirm={() => onSetArchived(order.id, true)}
            disabled={isUpdating}
            variant="chip"
            size="sm"
            confirm={confirm}
          />
        )}
        {authenticated && isArchived && (
          <>
            <ConfirmActionButton
              actionKey={`${order.id}:unarchive`}
              label="unarchive"
              onConfirm={() => onSetArchived(order.id, false)}
              disabled={isUpdating}
              variant="chip"
              size="sm"
              confirm={confirm}
            />
            <ConfirmActionButton
              actionKey={`${order.id}:delete`}
              label="delete"
              confirmLabel="delete?"
              onConfirm={() => onDeleteOrder(order.id)}
              disabled={isUpdating}
              variant="chip"
              size="sm"
              className="action-chip--danger"
              confirm={confirm}
            />
          </>
        )}
        {authenticated && !isArchived && STATUS_NEXT[order.status] && (
          <button
            type="button"
            onClick={() => onAdvanceStatus(order)}
            disabled={isUpdating}
            className="action-chip action-chip--sm"
          >
            {isUpdating ? "…" : STATUS_NEXT_LABEL[order.status]}
          </button>
        )}
      </div>
    </li>
  );
}
