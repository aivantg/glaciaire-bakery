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

const RECENTLY_FINISHED_MS = 5 * 60 * 1000;
const ARCHIVE_CONFIRM_MS = 3000;

function isRecentlyFinished(order: Order, now: number): boolean {
  return (
    order.status === "done" &&
    now - new Date(order.updatedAt).getTime() < RECENTLY_FINISHED_MS
  );
}

function isWorkingOnIt(order: Order, now: number): boolean {
  if (order.archived) return false;
  return (
    order.status === "pending" ||
    order.status === "in_progress" ||
    isRecentlyFinished(order, now)
  );
}

function isFinishedOrder(order: Order): boolean {
  return order.status === "done" && !order.archived;
}

function statusColor(s: OrderStatus) {
  if (s === "pending") return "#e94e89";
  if (s === "in_progress") return "#e09d28";
  return "#3d7348";
}

type OrderRowProps = {
  order: Order;
  orderNumber: number;
  isNew: boolean;
  authenticated: boolean;
  updating: string | null;
  confirmingArchiveId: string | null;
  onAdvanceStatus: (order: Order) => void;
  onArchiveClick: (orderId: string) => void;
  showArchived?: boolean;
};

function OrderRow({
  order,
  orderNumber,
  isNew,
  authenticated,
  updating,
  confirmingArchiveId,
  onAdvanceStatus,
  onArchiveClick,
  showArchived = false,
}: OrderRowProps) {
  const isDone = order.status === "done";
  const isArchived = order.archived;

  return (
    <li
      className={`py-5 sm:py-6 flex items-start justify-between gap-3 sm:gap-6 ${
        isNew ? "order-new" : ""
      } ${isDone || isArchived ? "opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">
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
          {showArchived && isArchived && (
            <span className="font-sans text-xs tracking-widest uppercase font-bold text-ink-400">
              archived
            </span>
          )}
        </div>
        <ul className="mt-1 font-sans text-sm font-medium text-ink-800 space-y-1">
          {order.items.map((item, i) => {
            const addonTotal = item.addons.reduce(
              (sum, a) => sum + a.unitPrice,
              0
            );
            const lineTotal = (item.unitPrice + addonTotal) * item.quantity;
            return (
              <li key={i}>
                <div>
                  {item.quantity}× {item.menuItemName}
                  <span className="text-ink-400 font-normal">
                    {" "}
                    — ${formatPrice(lineTotal)}
                  </span>
                </div>
                {item.addons.length > 0 && (
                  <ul className="ml-3 mt-0.5 text-ink-500 font-normal space-y-0.5">
                    {item.addons.map((addon, j) => (
                      <li key={j}>+ {addon.name}</li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <div className="font-mono text-xs text-ink-400 mt-1">
          {formatTime(order.createdAt)} · total ${formatPrice(order.total)}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        {authenticated && isDone && !isArchived && (
          <button
            onClick={() => onArchiveClick(order.id)}
            disabled={updating === order.id}
            className={`link-mono disabled:opacity-50 ${
              confirmingArchiveId === order.id ? "text-red-500" : ""
            }`}
          >
            {confirmingArchiveId === order.id ? "you sure?" : "archive"}
          </button>
        )}
        <span
          className="status-text"
          style={{ color: statusColor(order.status) }}
        >
          {STATUS_LABELS[order.status]}
        </span>
        {authenticated && STATUS_NEXT[order.status] && (
          <button
            onClick={() => onAdvanceStatus(order)}
            disabled={updating === order.id}
            className="link-mono disabled:opacity-50"
          >
            {updating === order.id ? "…" : STATUS_NEXT_LABEL[order.status]}
          </button>
        )}
      </div>
    </li>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <h2 className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600 pt-6 pb-2">
      {label} ({count})
    </h2>
  );
}

export default function OrdersPage() {
  const { authenticated } = useHostSession();
  const pathname = usePathname();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmingArchiveId, setConfirmingArchiveId] = useState<string | null>(
    null
  );
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const knownOrderIds = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);
  const archiveConfirmTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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
      setNow(Date.now());
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

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (archiveConfirmTimer.current) {
        clearTimeout(archiveConfirmTimer.current);
      }
    };
  }, []);

  function resetArchiveConfirm() {
    if (archiveConfirmTimer.current) {
      clearTimeout(archiveConfirmTimer.current);
      archiveConfirmTimer.current = null;
    }
    setConfirmingArchiveId(null);
  }

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

  async function archiveOrder(orderId: string) {
    if (confirmingArchiveId !== orderId) {
      if (archiveConfirmTimer.current) {
        clearTimeout(archiveConfirmTimer.current);
      }
      setConfirmingArchiveId(orderId);
      archiveConfirmTimer.current = setTimeout(() => {
        setConfirmingArchiveId(null);
        archiveConfirmTimer.current = null;
      }, ARCHIVE_CONFIRM_MS);
      return;
    }

    resetArchiveConfirm();
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      });
      if (!res.ok) return;
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  }

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

  const workingOnIt = useMemo(
    () => orders.filter((o) => isWorkingOnIt(o, now)),
    [orders, now]
  );

  const finishedOrders = useMemo(
    () => orders.filter((o) => isFinishedOrder(o)),
    [orders]
  );

  const renderOrder = (order: Order, showArchived = false) => (
    <OrderRow
      key={order.id}
      order={order}
      orderNumber={orderNumbers[order.id]}
      isNew={newOrderIds.has(order.id)}
      authenticated={authenticated === true}
      updating={updating}
      confirmingArchiveId={confirmingArchiveId}
      onAdvanceStatus={advanceStatus}
      onArchiveClick={archiveOrder}
      showArchived={showArchived}
    />
  );

  const customerHasOrders = workingOnIt.length > 0 || finishedOrders.length > 0;

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-6xl sm:text-8xl md:text-[10rem] break-words">
        the queue
      </h1>

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

      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 row-hairline py-3">
        {authenticated ? (
          <h2 className="font-sans text-xs tracking-widest uppercase font-bold text-ink-900">
            all orders ({orders.length})
          </h2>
        ) : (
          <div className="font-sans text-xs tracking-widest uppercase font-bold text-ink-600">
            live queue
          </div>
        )}
        <div className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-leaf-700 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-leaf-500"></span>
          </span>
          live
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 font-sans text-ink-400">
          loading orders…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : authenticated ? (
        orders.length === 0 ? (
          <div className="text-center py-16 font-sans text-ink-400">
            no orders yet — place one from the menu!
          </div>
        ) : (
          <ul className="list-hairline">{orders.map((o) => renderOrder(o, true))}</ul>
        )
      ) : !customerHasOrders ? (
        <div className="text-center py-16 font-sans text-ink-400">
          no orders yet — place one from the menu!
        </div>
      ) : (
        <>
          {workingOnIt.length > 0 && (
            <>
              <SectionHeader label="working on it" count={workingOnIt.length} />
              <ul className="list-hairline">
                {workingOnIt.map((o) => renderOrder(o))}
              </ul>
            </>
          )}
          {finishedOrders.length > 0 && (
            <>
              <SectionHeader
                label="finished orders"
                count={finishedOrders.length}
              />
              <ul className="list-hairline">
                {finishedOrders.map((o) => renderOrder(o))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
