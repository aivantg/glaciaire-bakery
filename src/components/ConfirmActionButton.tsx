"use client";

import type { useConfirmAction } from "@/hooks/useConfirmAction";

type ConfirmAction = ReturnType<typeof useConfirmAction>;

type ConfirmActionButtonProps = {
  actionKey: string;
  label: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  variant?: "link" | "chip";
  size?: "default" | "sm";
  confirm: ConfirmAction;
};

export function ConfirmActionButton({
  actionKey,
  label,
  confirmLabel = "you sure?",
  onConfirm,
  disabled,
  className = "",
  variant = "link",
  size = "default",
  confirm,
}: ConfirmActionButtonProps) {
  const confirming = confirm.isConfirming(actionKey);

  const baseClass =
    variant === "chip"
      ? `action-chip${size === "sm" ? " action-chip--sm" : ""}`
      : "link-mono disabled:opacity-50";
  const confirmClass =
    variant === "chip"
      ? confirming
        ? "action-chip--confirm"
        : ""
      : confirming
        ? "text-red-500"
        : "";

  return (
    <button
      type="button"
      onClick={() => confirm.runWithConfirm(actionKey, onConfirm)}
      disabled={disabled}
      className={`${baseClass} ${confirmClass} ${className}`.trim()}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}
