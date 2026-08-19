"use client";

import { useState } from "react";
import type { Order } from "@/lib/store";
import { addonSublistClass, orderItemsForDisplay } from "@/lib/order-display";
import { formatPrice, formatTime } from "@/lib/format";
import {
  orderItemCount,
  STATUS_LABELS,
  statusColor,
} from "@/lib/order-queue";

export function ReadyCalloutRow({
  order,
  orderNumber,
  statusPalette = "default",
}: {
  order: Order;
  orderNumber: number;
  statusPalette?: "default" | "stonefruit";
}) {
  const [open, setOpen] = useState(false);
  const count = orderItemCount(order);

  return (
    <li>
      <button
        type="button"
        className="w-full py-2 flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <div className="min-w-0 flex items-baseline gap-2">
          <span className="font-mono text-xs font-bold text-ink-400">
            #{orderNumber}
          </span>
          <span className="font-sans font-bold text-base text-ink-900 truncate">
            {order.customerName || "guest"}
          </span>
          <span className="font-sans text-sm text-ink-400 shrink-0">
            ({count})
          </span>
        </div>
        <span
          className="status-text shrink-0"
          style={{ color: statusColor("done", statusPalette) }}
        >
          {STATUS_LABELS.done}
        </span>
      </button>
      {open && (
        <div className="pb-3 pl-1">
          <ul className="font-sans text-sm font-medium text-ink-800 space-y-2">
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
                  <ul className={`ml-3 ${addonSublistClass} order-queue-addons`}>
                    {line.addons.map((addon, j) => (
                      <li key={j} className="font-semibold text-ink-800">
                        <span className="font-normal text-ink-500">+ </span>
                        {addon.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          {order.notes?.trim() ? (
            <p className="mt-2 font-sans text-sm font-semibold text-ink-800">
              note: {order.notes.trim()}
            </p>
          ) : null}
          <div className="font-mono text-xs text-ink-400 mt-1">
            {formatTime(order.createdAt)} · total ${formatPrice(order.total)}
          </div>
        </div>
      )}
    </li>
  );
}
