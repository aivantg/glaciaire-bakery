"use client";

import Link from "next/link";
import type { QueueFilter } from "@/lib/order-queue";
import { queueEmptyState } from "@/lib/order-queue";

type QueueEmptyStateProps = {
  filter: QueueFilter;
  hasAnyOrders: boolean;
  menuPath: string;
};

export function QueueEmptyState({
  filter,
  hasAnyOrders,
  menuPath,
}: QueueEmptyStateProps) {
  const { title, hint, showMenuLink } = queueEmptyState(filter, hasAnyOrders);

  return (
    <div className="text-center py-16 sm:py-20 px-4">
      <p className="sf-queue-empty-title font-sans font-black text-2xl sm:text-3xl text-ink-900 tracking-tight">
        {title}
      </p>
      <p className="mt-3 font-sans text-sm text-ink-500 max-w-md mx-auto leading-relaxed">
        {hint}
      </p>
      {showMenuLink && (
        <Link href={menuPath} className="link-mono inline-block mt-6">
          start an order →
        </Link>
      )}
    </div>
  );
}
