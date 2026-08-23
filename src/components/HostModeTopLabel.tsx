"use client";

import { useHostSession } from "@/hooks/useHostSession";

export function HostModeTopLabel({
  className = "",
}: {
  className?: string;
}) {
  const { authenticated } = useHostSession();
  if (authenticated !== true) return null;

  return (
    <p className={`text-center font-mono text-xs ${className}`}>
      (host mode)
    </p>
  );
}
