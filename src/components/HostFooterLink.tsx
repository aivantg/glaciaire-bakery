"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHostSession } from "@/hooks/useHostSession";

const FOOTER_PATHS = ["/order", "/orders"];

export function HostFooterLink() {
  const pathname = usePathname();
  const { authenticated, logout } = useHostSession();

  if (!pathname || !FOOTER_PATHS.includes(pathname)) return null;

  const loginHref = `/host?next=${encodeURIComponent(pathname)}`;

  if (authenticated === null) {
    return <span className="font-mono text-xs text-ink-300">·</span>;
  }

  if (authenticated) {
    return (
      <div className="flex items-center justify-center gap-5">
        <Link
          href="/menu"
          className="font-mono text-xs tracking-widest uppercase text-ink-400 hover:text-ink-900"
        >
          admin
        </Link>
        <button
          type="button"
          onClick={logout}
          className="font-mono text-xs tracking-widest uppercase text-ink-400 hover:text-ink-900"
        >
          host logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href={loginHref}
      className="font-mono text-xs tracking-widest uppercase text-ink-300 hover:text-ink-900"
    >
      host login
    </Link>
  );
}
