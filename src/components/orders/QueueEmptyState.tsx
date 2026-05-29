"use client";

import Link from "next/link";
import type { QueueFilter } from "@/lib/order-queue";
import { queueEmptyState } from "@/lib/order-queue";

type QueueEmptyStateProps = {
  filter: QueueFilter;
  hasAnyOrders: boolean;
};

export function QueueEmptyState({
  filter,
  hasAnyOrders,
}: QueueEmptyStateProps) {
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
        <Link href="/" className="link-mono inline-block mt-6">
          start an order →
        </Link>
      )}
    </div>
  );
}
