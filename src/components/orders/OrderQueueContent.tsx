"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Order } from "@/lib/store";
import {
  isFinishedOrder,
  isRecentlyFinished,
  isWorkingOnIt,
  matchesFilter,
  sortOrders,
  sortReadyNewestFirst,
  STATUS_NEXT,
  type QueueFilter,
} from "@/lib/order-queue";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useHostSession } from "@/hooks/useHostSession";
import { popupApiBase } from "@/lib/popups";
import { QueueToolbar } from "@/components/orders/QueueToolbar";
import { QueueEmptyState } from "@/components/orders/QueueEmptyState";
import { OrderQueueRow } from "@/components/orders/OrderQueueRow";
import { ReadyCalloutRow } from "@/components/orders/ReadyCalloutRow";
import { ArchiveAllOrdersModal } from "@/components/orders/ArchiveAllOrdersModal";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";

const CONFIRM_MS = 3000;
const HOST_POLL_MS = 3000;
const CUSTOMER_POLL_MS = 10000;

export function OrderQueueContent({
  slug,
  menuPath,
}: {
  slug: string;
  menuPath: string;
}) {
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
  const api = popupApiBase(slug);

  const fetchOrders = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${api}/orders`);
      if (!res.ok) throw new Error("Failed to load orders");
      const data: Order[] = await res.json();

      if (!isFirstFetch.current) {
        const incoming = data.map((o) => o.id);
        const arrived = incoming.filter((id) => !knownOrderIds.current.has(id));
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
  }, [api]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(
      fetchOrders,
      authenticated ? HOST_POLL_MS : CUSTOMER_POLL_MS
    );
    return () => clearInterval(interval);
  }, [authenticated, fetchOrders]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  async function advanceStatus(order: Order) {
    const nextStatus = STATUS_NEXT[order.status];
    if (!nextStatus) return;

    setUpdating(order.id);
    try {
      const res = await fetch(`${api}/orders/${order.id}`, {
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
      const res = await fetch(`${api}/orders/archive-finished`, {
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
      const res = await fetch(`${api}/orders/${orderId}`, {
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
      const res = await fetch(`${api}/orders/${orderId}`, { method: "DELETE" });
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

  const recentlyReady = useMemo(
    () =>
      filter === "working_on_it"
        ? sortReadyNewestFirst(
            orders.filter((o) => isRecentlyFinished(o, now))
          )
        : [],
    [orders, filter, now]
  );

  const filteredOrders = useMemo(() => {
    if (filter === "finished") {
      return sortReadyNewestFirst(orders.filter((o) => isFinishedOrder(o)));
    }
    const visible = orders.filter((o) => matchesFilter(o, filter, now));
    if (filter === "working_on_it") {
      return sortOrders(visible.filter((o) => !isRecentlyFinished(o, now)));
    }
    return sortOrders(visible);
  }, [orders, filter, now]);

  const themed = slug === "stonefruit";

  return (
    <div className={themed ? "sf-queue pt-2" : "pt-6"}>
      <h1
        className={
          themed
            ? "sf-display text-5xl sm:text-6xl text-center mb-4"
            : "hero-stack text-5xl sm:text-7xl md:text-8xl mb-2"
        }
      >
        the queue
      </h1>

      <div className={themed ? "sf-ops-panel" : undefined}>
      <QueueToolbar
        filterOptions={filterOptions}
        filter={filter}
        counts={counts}
        onFilterChange={setFilter}
        className={themed ? "mt-0 pt-1 pb-2" : undefined}
      />

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

      {loading ? (
        <LoadingState message="loading orders…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : recentlyReady.length === 0 && filteredOrders.length === 0 ? (
        <QueueEmptyState
          filter={filter}
          hasAnyOrders={orders.length > 0}
          menuPath={menuPath}
        />
      ) : (
        <ul className="list-hairline">
          {recentlyReady.map((order) => (
            <ReadyCalloutRow
              key={order.id}
              order={order}
              orderNumber={orderNumbers[order.id]}
              statusPalette={themed ? "stonefruit" : "default"}
            />
          ))}
          {filteredOrders.map((order) => (
            <OrderQueueRow
              key={order.id}
              order={order}
              orderNumber={orderNumbers[order.id]}
              isNew={newOrderIds.has(order.id)}
              authenticated={authenticated === true}
              updating={updating}
              confirm={confirm}
              statusPalette={themed ? "stonefruit" : "default"}
              onAdvanceStatus={advanceStatus}
              onSetArchived={setOrderArchived}
              onDeleteOrder={deleteOrder}
            />
          ))}
        </ul>
      )}
      </div>

      {showArchiveAllModal && (
        <ArchiveAllOrdersModal
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
    </div>
  );
}
