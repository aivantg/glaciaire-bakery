import type { Order, OrderStatus } from "@/lib/store";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "in queue",
  in_progress: "preparing",
  done: "ready!",
};

export const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "in_progress",
  in_progress: "done",
};

export const STATUS_NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "start",
  in_progress: "mark ready",
};

export const RECENTLY_FINISHED_MS = 60 * 1000;
export const ARCHIVED_STATUS_COLOR = "#6b7280";

export type QueueFilter = "working_on_it" | "finished" | "all";

export const FILTER_LABELS: Record<QueueFilter, string> = {
  working_on_it: "working on it",
  finished: "ready!",
  all: "all",
};

export function isRecentlyFinished(order: Order, now: number): boolean {
  return (
    order.status === "done" &&
    now - new Date(order.updatedAt).getTime() < RECENTLY_FINISHED_MS
  );
}

export function isWorkingOnIt(order: Order, now: number): boolean {
  if (order.archived) return false;
  return (
    order.status === "pending" ||
    order.status === "in_progress" ||
    isRecentlyFinished(order, now)
  );
}

export function isFinishedOrder(order: Order): boolean {
  return order.status === "done" && !order.archived;
}

export function matchesFilter(
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

export function sortOrders(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => {
    const rankDiff = orderSortRank(a) - orderSortRank(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function statusColor(s: OrderStatus): string {
  if (s === "pending") return "#e94e89";
  if (s === "in_progress") return "#e09d28";
  return "#16a34a";
}

export function queueEmptyState(
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
