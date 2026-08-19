"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHostSession } from "@/hooks/useHostSession";
import { isReservedSlug } from "@/lib/popups";

function showOnPath(pathname: string): boolean {
  if (["/", "/order", "/orders"].includes(pathname)) return true;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 1 && !isReservedSlug(parts[0])) return true;
  if (
    parts.length === 2 &&
    parts[1] === "orders" &&
    !isReservedSlug(parts[0])
  ) {
    return true;
  }
  return false;
}

export function HostFooterLink() {
  const pathname = usePathname();
  const { authenticated } = useHostSession();

  if (!pathname || !showOnPath(pathname)) return null;

  const loginHref = `/host?next=${encodeURIComponent(pathname)}`;

  if (authenticated === null) {
    return <span className="font-mono text-xs text-ink-300">·</span>;
  }

  if (authenticated) {
    return (
      <Link
        href="/admin"
        className="font-mono text-xs tracking-widest uppercase text-ink-400 hover:text-ink-900"
      >
        admin
      </Link>
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
