"use client";

import { useCallback, useEffect, useState } from "react";

export interface HostSession {
  authenticated: boolean | null; // null while loading
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useHostSession(): HostSession {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { authenticated, refresh, logout };
}
