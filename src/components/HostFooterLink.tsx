"use client";

import Link from "next/link";
import { useHostSession } from "@/hooks/useHostSession";

export function HostFooterLink() {
  const { authenticated, logout } = useHostSession();

  if (authenticated === null) {
    return <span className="font-mono text-xs text-ink-300">·</span>;
  }

  if (authenticated) {
    return (
      <button
        type="button"
        onClick={logout}
        className="font-mono text-xs tracking-widest uppercase text-ink-400 hover:text-ink-900"
      >
        host logout
      </button>
    );
  }

  return (
    <Link
      href="/host"
      className="font-mono text-xs tracking-widest uppercase text-ink-300 hover:text-ink-900"
    >
      host login
    </Link>
  );
}
