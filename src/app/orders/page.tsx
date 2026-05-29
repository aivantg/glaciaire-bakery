"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/store";
import { addonSublistClass, orderItemsForDisplay } from "@/lib/order-display";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { useConfirmAction } from "@/hooks/useConfirmAction";
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

const RECENTLY_FINISHED_MS = 60 * 1000;
const CONFIRM_MS = 3000;

const ARCHIVED_STATUS_COLOR = "#6b7280";

type QueueFilter = "working_on_it" | "finished" | "all";

const FILTER_LABELS: Record<QueueFilter, string> = {
  working_on_it: "working on it",
  finished: "ready!",
  all: "all",
};

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

function matchesFilter(
  order: Order,
  filter: QueueFilter,
  now: number
): boolean {
  if (filter === "all") return true;
  if (filter === "working_on_it") return isWorkingOnIt(order, now);
  return isFinishedOrder(order);
}

function orderSortRank(order: Order): number {
  if (order.archived) return 4;
  if (order.status === "done") return 1;
  if (order.status === "in_progress") return 2;
  return 3;
}

function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const rankDiff = orderSortRank(a) - orderSortRank(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function statusColor(s: OrderStatus) {
  if (s === "pending") return "#e94e89";
  if (s === "in_progress") return "#e09d28";
  return "#16a34a"; // ready — prominent green
}

function queueEmptyState(
  filter: QueueFilter,
  hasAnyOrders: boolean
): { title: string; hint: string; showMenuLink: boolean } {
  if (!hasAnyOrders) {
    return {
      title: "no orders yet",
      hint: "the queue is quiet — be the first to order.",
      showMenuLink: true,
    };
  }
  switch (filter) {
    case "working_on_it":
      return {
        title: "counter's clear",
        hint: "be the change you wanna see!",
        showMenuLink: true,
      };
    case "finished":
      return {
        title: "we're working on it",
        hint: "check back in a bit!",
        showMenuLink: false,
      };
    case "all":
      return {
        title: "no orders yet",
        hint: "ahh, the smell of a fresh new website",
        showMenuLink: false,
      };
  }
}

function QueueEmptyState({
  filter,
  hasAnyOrders,
}: {
  filter: QueueFilter;
  hasAnyOrders: boolean;
}) {
  const { title, hint, showMenuLink } = queueEmptyState(filter, hasAnyOrders);

  return (
    <div className="text-center py-16 sm:py-20 px-4">
      <p className="font-sans font-black text-2xl sm:text-3xl text-ink-900 tracking-tight">
        {title}
      </p>
      <p className="mt-3 font-sans text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
        {hint}
      </p>
      {showMenuLink && (
        <Link href="/order" className="link-mono inline-block mt-6">
          start an order →
        </Link>
      )}
    </div>
  );
}

type OrderRowProps = {
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

function OrderRow({
  order,
  orderNumber,
  isNew,
  authenticated,
  updating,
  confirm,
  onAdvanceStatus,
  onSetArchived,
  onDeleteOrder,
}: OrderRowProps) {
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
        className={`min-w-0 flex-1 ${isDone || isArchived ? "opacity-50" : ""}`}
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

type ArchiveAllModalProps = {
  finishedCount: number;
  archiving: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

function ArchiveAllModal({
  finishedCount,
  archiving,
  error,
  onConfirm,
  onCancel,
}: ArchiveAllModalProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-all-title"
      onClick={archiving ? undefined : onCancel}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2
          id="archive-all-title"
          className="font-sans font-black text-xl sm:text-2xl text-ink-900"
        >
          archive all ready orders?
        </h2>
        <p className="mt-4 font-sans text-sm text-ink-700 leading-relaxed">
          This will hide{" "}
          <span className="font-semibold text-ink-900">
            {finishedCount} ready order{finishedCount === 1 ? "" : "s"}
          </span>{" "}
          from the queue for customers. You can manually unarchive individual
          orders later.
        </p>
        {error && (
          <p className="mt-3 font-sans text-sm text-red-500">{error}</p>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={archiving}
            className="btn-dark"
          >
            {archiving ? "archiving…" : "archive all"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={archiving}
            className="link-mono"
          >
            cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { authenticated } = useHostSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("working_on_it");
  const [updating, setUpdating] = useState<string | null>(null);
  const [showArchiveAllModal, setShowArchiveAllModal] = useState(false);
  const [archivingAll, setArchivingAll] = useState(false);
  const [archiveAllError, setArchiveAllError] = useState<string | null>(null);
  const confirm = useConfirmAction(CONFIRM_MS);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
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

  async function archiveAllFinished() {
    setArchiveAllError(null);
    setArchivingAll(true);
    try {
      const res = await fetch("/api/orders/archive-finished", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Archive failed");
      setShowArchiveAllModal(false);
      await fetchOrders();
    } catch (e) {
      setArchiveAllError(
        e instanceof Error ? e.message : "Something went wrong"
      );
    } finally {
      setArchivingAll(false);
    }
  }

  async function setOrderArchived(orderId: string, archived: boolean) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived }),
      });
      if (!res.ok) return;
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  }

  async function deleteOrder(orderId: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
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

  const filterOptions = useMemo((): QueueFilter[] => {
    const options: QueueFilter[] = ["working_on_it", "finished"];
    if (authenticated) options.push("all");
    return options;
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated && filter === "all") {
      setFilter("working_on_it");
    }
  }, [authenticated, filter]);

  const counts = useMemo(() => {
    return {
      working_on_it: orders.filter((o) => isWorkingOnIt(o, now)).length,
      finished: orders.filter((o) => isFinishedOrder(o)).length,
      all: orders.length,
    };
  }, [orders, now]);

  const filteredOrders = useMemo(
    () =>
      sortOrders(orders.filter((o) => matchesFilter(o, filter, now))),
    [orders, filter, now]
  );

  const renderOrder = (order: Order) => (
    <OrderRow
      key={order.id}
      order={order}
      orderNumber={orderNumbers[order.id]}
      isNew={newOrderIds.has(order.id)}
      authenticated={authenticated === true}
      updating={updating}
      confirm={confirm}
      onAdvanceStatus={advanceStatus}
      onSetArchived={setOrderArchived}
      onDeleteOrder={deleteOrder}
    />
  );

  return (
    <div className="pt-6">
      <h1 className="hero-stack text-6xl sm:text-8xl md:text-[10rem] break-words">
        the queue
      </h1>

      <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 row-hairline py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-5 font-sans text-xs tracking-widest uppercase font-bold">
          {filterOptions.map((option) => {
            const active = filter === option;
            return (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`transition-colors ${
                  active
                    ? "text-ink-900"
                    : "text-ink-400 hover:text-ink-900"
                }`}
              >
                {FILTER_LABELS[option]} ({counts[option]})
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 font-sans text-xs tracking-widest uppercase text-leaf-700 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-leaf-500"></span>
          </span>
          live
        </div>
      </div>

      {filter === "finished" && authenticated && (
        <div className="mt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              setArchiveAllError(null);
              setShowArchiveAllModal(true);
            }}
            disabled={counts.finished === 0 || archivingAll}
            className="action-chip action-chip--sm"
          >
            archive all
            {counts.finished > 0 ? ` (${counts.finished})` : ""}
          </button>
        </div>
      )}

      {showArchiveAllModal && (
        <ArchiveAllModal
          finishedCount={counts.finished}
          archiving={archivingAll}
          error={archiveAllError}
          onConfirm={archiveAllFinished}
          onCancel={() => {
            if (!archivingAll) {
              setShowArchiveAllModal(false);
              setArchiveAllError(null);
            }
          }}
        />
      )}

      {loading ? (
        <div className="text-center py-12 font-sans text-ink-400">
          loading orders…
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <QueueEmptyState filter={filter} hasAnyOrders={orders.length > 0} />
      ) : (
        <ul className="list-hairline">{filteredOrders.map(renderOrder)}</ul>
      )}
    </div>
  );
}
