"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { customerPath, ordersPath } from "@/lib/popups";

export function StonefruitNavPill({
  slug,
  isHome,
}: {
  slug: string;
  isHome: boolean;
}) {
  const pathname = usePathname() || "";
  const onQueue =
    pathname === "/orders" ||
    pathname.endsWith("/orders") ||
    pathname.includes("/orders/");

  if (onQueue) {
    return (
      <Link href={customerPath(slug, isHome)} className="sf-nav-pill mt-1">
        home
      </Link>
    );
  }

  return (
    <Link href={ordersPath(slug, isHome)} className="sf-nav-pill mt-1">
      queue
    </Link>
  );
}
