"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, OrderStatus } from "@/lib/store";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-bakery-100 text-bakery-800 border-bakery-200",
  done: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "in_progress",
  in_progress: "done",
};

const STATUS_NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Start",
  in_progress: "Mark Done ✓",
};

type FilterStatus = OrderStatus | "all";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
      setOrders(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
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

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bakery-800">Orders</h1>
        <button
          onClick={() => fetchOrders()}
          className="text-sm text-bakery-500 hover:text-bakery-700 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            filter === "all"
              ? "bg-bakery-600 text-white border-bakery-600"
              : "border-bakery-200 text-bakery-700 hover:bg-bakery-50"
          }`}
        >
          All ({orders.length})
        </button>
        {(["pending", "in_progress", "done"] as OrderStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === s
                ? "bg-bakery-600 text-white border-bakery-600"
                : "border-bakery-200 text-bakery-700 hover:bg-bakery-50"
            }`}
          >
            {STATUS_LABELS[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-bakery-400">Loading orders…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-bakery-300">
          {orders.length === 0
            ? "No orders yet. Place one from the Order tab! 🌸"
            : "No orders matching this filter."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white border border-bakery-100 rounded-2xl p-4 shadow-sm transition-opacity ${
                order.status === "done" ? "opacity-60" : ""
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.customerName && (
                      <span className="font-semibold text-gray-800">
                        {order.customerName}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  {STATUS_NEXT[order.status] && (
                    <button
                      onClick={() => advanceStatus(order)}
                      disabled={updating === order.id}
                      className="text-xs px-3 py-1 bg-bakery-500 hover:bg-bakery-600 disabled:opacity-50 text-white rounded-full font-medium transition-colors"
                    >
                      {updating === order.id
                        ? "…"
                        : STATUS_NEXT_LABEL[order.status]}
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <ul className="text-sm text-gray-700 space-y-0.5 mb-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.menuItemName} × {item.quantity}
                    </span>
                    <span className="text-gray-500">
                      ${formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Total */}
              <div className="border-t border-bakery-100 pt-2 flex justify-between text-sm font-semibold text-bakery-800">
                <span>Total</span>
                <span>${formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
