"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/app/logo.jpg";

export function TopNav() {
  const pathname = usePathname();

  let counterpart: { href: string; label: string } | null = null;
  if (pathname === "/" || pathname === "/order") {
    counterpart = { href: "/orders", label: "queue" };
  } else if (pathname === "/orders") {
    counterpart = { href: "/", label: "menu" };
  }

  return (
    <header className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-center justify-between gap-3 text-sm">
      <Link
        href="/"
        className="flex items-center gap-2 min-w-0 font-sans italic font-black text-ink-900 tracking-tight text-lg hover:opacity-80"
      >
        <Image
          src={logo}
          alt=""
          width={36}
          height={36}
          className="rounded-full shrink-0 object-cover h-9 w-9"
          priority
        />
        <span className="truncate">Glaciaire</span>
      </Link>
      {counterpart && (
        <Link
          href={counterpart.href}
          className="shrink-0 uppercase tracking-widest text-ink-900 font-bold text-sm sm:text-base px-4 py-2 rounded-full border-2 border-ink-900 hover:bg-ink-900 hover:text-white transition-colors"
        >
          {counterpart.label}
        </Link>
      )}
    </header>
  );
}
