"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Order, OrderStatus } from "@/lib/store";
import { useHostSession } from "@/hooks/useHostSession";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "in queue",
  in_progress: "preparing",
  done: "ready!",
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "in_progress",
  in_progress: "done",
};

const STATUS_NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "start",
  in_progress: "mark ready",
};

type FilterStatus = OrderStatus | "all";

export default function OrdersPage() {
  const { authenticated } = useHostSession();
  const pathname = usePathname();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      const data: Order[] = await res.json();

      if (!isFirstFetch.current) {
        const incoming = data.map((o) => o.id);
        const arrived = incoming.filter(
          (id) => !knownOrderIds.current.has(id)
        );
        if (arrived.length > 0) {
          setNewOrderIds((prev) => {
            const next = new Set(prev);
            arrived.forEach((id) => next.add(id));
            return next;
          });
          setTimeout(() => {
            setNewOrderIds((prev) => {
              const next = new Set(prev);
              arrived.forEach((id) => next.delete(id));
              return next;
            });
          }, 4000);
        }
      }

      knownOrderIds.current = new Set(data.map((o) => o.id));
      isFirstFetch.current = false;
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  async function advanceStatus(order: Order) {
    const nextStatus = STATUS_NEXT[order.status];
    if (!nextStatus) return;

    setUpdating(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) return;
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  }

  // Chronological order numbers — #1 is the very first order ever placed.
  // `orders` is sorted createdAt desc, so number = (total - reverseIdx).
  const orderNumbers = useMemo(() => {
    const sorted = [...orders].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const map: Record<string, number> = {};
    sorted.forEach((o, i) => {
      map[o.id] = i + 1;
    });
    return map;
  }, [orders]);

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>
  );

  function statusColor(s: OrderStatus) {
    if (s === "pending") return "#e94e89";
    if (s === "in_progress") return "#e09d28";
    return "#3d7348";
  }

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-6xl sm:text-8xl md:text-[10rem] break-words">the queue</h1>

      {authenticated === false && (
        <div className="mt-6 row-hairline py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-sans text-sm text-ink-600">
            log in as host to update order status.
          </p>
          <Link
            href={`/host?next=${encodeURIComponent(pathname || "/orders")}`}
            className="link-mono text-ink-900"
          >
            host login →
          </Link>
        </div>
      )}

      {/* Filter row + live indicator */}
      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 row-hairline py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-5 font-sans text-xs tracking-widest uppercase font-bold">
          {(["all", "pending", "in_progress", "done"] as FilterStatus[]).map(
            (s) => {
              const active = filter === s;
              const label =
                s === "all" ? "all" : STATUS_LABELS[s as OrderStatus];
              const count =
                s === "all" ? orders.length : counts[s as OrderStatus] ?? 0;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`transition-colors ${
                    active
                      ? "text-ink-900"
                      : "text-ink-400 hover:text-ink-900"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            }
          )}
        </div>
        <div className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-leaf-700 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-leaf-500"></span>
          </span>
          live
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="text-center py-12 font-sans text-ink-400">
          loading orders…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 font-sans text-ink-400">
          {orders.length === 0
            ? "no orders yet — place one from the menu!"
            : "nothing matching this filter."}
        </div>
      ) : (
        <ul className="list-hairline">
          {filteredOrders.map((order) => {
            const isNew = newOrderIds.has(order.id);
            const isDone = order.status === "done";
            return (
              <li
                key={order.id}
                className={`py-5 sm:py-6 flex items-start justify-between gap-3 sm:gap-6 ${
                  isNew ? "order-new" : ""
                } ${isDone ? "opacity-50" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-sm sm:text-base font-bold text-ink-400">
                      #{orderNumbers[order.id]}
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
                  <ul className="mt-1 font-sans text-sm font-medium text-ink-800 space-y-0.5">
                    {order.items.map((item, i) => (
                      <li key={i}>
                        {item.quantity}× {item.menuItemName}
                        <span className="text-ink-400 font-normal">
                          {" "}
                          — ${formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="font-mono text-xs text-ink-400 mt-1">
                    {formatTime(order.createdAt)} · total $
                    {formatPrice(order.total)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className="status-text"
                    style={{ color: statusColor(order.status) }}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  {authenticated && STATUS_NEXT[order.status] && (
                    <button
                      onClick={() => advanceStatus(order)}
                      disabled={updating === order.id}
                      className="link-mono disabled:opacity-50"
                    >
                      {updating === order.id
                        ? "…"
                        : STATUS_NEXT_LABEL[order.status]}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
