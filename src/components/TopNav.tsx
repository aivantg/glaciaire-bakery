"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import icon from "@/app/icon.png";

export function TopNav() {
  const pathname = usePathname();

  let counterpart: { href: string; label: string } | null = null;
  if (pathname === "/order") {
    counterpart = { href: "/orders", label: "queue" };
  } else if (pathname === "/orders") {
    counterpart = { href: "/order", label: "menu" };
  }

  return (
    <header className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between text-sm">
      <Link
        href="/"
        className="flex items-center gap-2 font-sans italic font-black text-ink-900 tracking-tight text-lg hover:opacity-80"
      >
        <Image
          src={icon}
          alt=""
          width={28}
          height={28}
          className="rounded-full"
          priority
        />
        Glaciare
      </Link>
      <nav className="flex gap-5 uppercase tracking-widest text-ink-600 font-bold text-xs">
        {counterpart && (
          <Link href={counterpart.href} className="hover:text-ink-900">
            {counterpart.label}
          </Link>
        )}
      </nav>
    </header>
  );
}
