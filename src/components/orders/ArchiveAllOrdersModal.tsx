"use client";

import { ModalShell } from "@/components/shared/ModalShell";

type ArchiveAllOrdersModalProps = {
  finishedCount: number;
  archiving: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ArchiveAllOrdersModal({
  finishedCount,
  archiving,
  error,
  onConfirm,
  onCancel,
}: ArchiveAllOrdersModalProps) {
  return (
    <ModalShell
      titleId="archive-all-title"
      onBackdropClick={archiving ? undefined : onCancel}
    >
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
    </ModalShell>
  );
}
