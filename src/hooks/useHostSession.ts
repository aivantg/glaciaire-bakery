"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export interface HostSession {
  authenticated: boolean | null; // null while loading
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useHostSession(): HostSession {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/host/session", { cache: "no-store" });
      const data = await res.json();
      setAuthenticated(!!data.authenticated);
    } catch {
      setAuthenticated(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/host/session", { method: "DELETE" });
    setAuthenticated(false);
  }, []);

  // Re-check auth on every route change so the layout reflects login/logout
  // without requiring a full page refresh (the root layout persists across
  // client-side navigations in Next.js App Router).
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  return { authenticated, refresh, logout };
}
