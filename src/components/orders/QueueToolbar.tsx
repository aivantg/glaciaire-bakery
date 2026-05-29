"use client";

import type { QueueFilter } from "@/lib/order-queue";
import { FILTER_LABELS } from "@/lib/order-queue";

type QueueToolbarProps = {
  filterOptions: QueueFilter[];
  filter: QueueFilter;
  counts: Record<QueueFilter, number>;
  onFilterChange: (filter: QueueFilter) => void;
};

export function QueueToolbar({
  filterOptions,
  filter,
  counts,
  onFilterChange,
}: QueueToolbarProps) {
  return (
    <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 row-hairline py-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-5 font-sans text-xs tracking-widest uppercase font-bold">
        {filterOptions.map((option) => {
          const active = filter === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              className={`transition-colors ${
                active ? "text-ink-900" : "text-ink-400 hover:text-ink-900"
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
  );
}
