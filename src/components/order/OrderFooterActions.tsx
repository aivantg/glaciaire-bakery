"use client";

import { formatPrice } from "@/lib/format";

type OrderFooterActionsProps = {
  totalCount: number;
  total: number;
  hasItems: boolean;
  onViewQueue: () => void;
};

export function OrderFooterActions({
  totalCount,
  total,
  hasItems,
  onViewQueue,
}: OrderFooterActionsProps) {
  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <button type="submit" disabled={!hasItems} className="btn-dark">
        {totalCount === 0
          ? "add something tasty"
          : `review order (${totalCount}) — $${formatPrice(total)}`}
      </button>
      <button type="button" onClick={onViewQueue} className="link-mono">
        view queue →
      </button>
    </div>
  );
}
