"use client";

import type { ReactNode } from "react";

type ModalShellProps = {
  titleId: string;
  onBackdropClick?: () => void;
  children: ReactNode;
};

export function ModalShell({
  titleId,
  onBackdropClick,
  children,
}: ModalShellProps) {
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onBackdropClick}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
