"use client";

import Link from "next/link";
import { useHostSession } from "@/hooks/useHostSession";

export function TopNav() {
  const { authenticated } = useHostSession();

  return (
    <header className="max-w-5xl mx-auto w-full px-6 pt-6 pb-2 flex items-center justify-between text-sm">
      <Link
        href="/"
        className="font-sans italic font-black text-ink-900 tracking-tight text-lg hover:opacity-80"
      >
        Glaciare
      </Link>
      <nav className="flex gap-5 uppercase tracking-widest text-ink-600 font-bold text-xs">
        <Link href="/order" className="hover:text-ink-900">
          menu
        </Link>
        <Link href="/orders" className="hover:text-ink-900">
          queue
        </Link>
        {authenticated && (
          <Link href="/menu" className="hover:text-ink-900">
            admin
          </Link>
        )}
      </nav>
    </header>
  );
}
