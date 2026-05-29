"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_CONFIRM_MS = 3000;

/**
 * Two-tap confirmation: first click arms, second click within `confirmMs` runs the action.
 * Only one key can be armed at a time; arming a new key clears the previous.
 */
export function useConfirmAction(confirmMs = DEFAULT_CONFIRM_MS) {
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearConfirm = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setConfirmingKey(null);
  }, []);

  useEffect(() => () => clearConfirm(), [clearConfirm]);

  const isConfirming = useCallback(
    (key: string) => confirmingKey === key,
    [confirmingKey]
  );

  const runWithConfirm = useCallback(
    (key: string, action: () => void | Promise<void>) => {
      if (confirmingKey !== key) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setConfirmingKey(key);
        timerRef.current = setTimeout(() => {
          setConfirmingKey(null);
          timerRef.current = null;
        }, confirmMs);
        return;
      }
      clearConfirm();
      void action();
    },
    [confirmingKey, confirmMs, clearConfirm]
  );

  return { isConfirming, runWithConfirm, clearConfirm };
}
