import Link from "next/link";
import type { ReactNode } from "react";

export function HostShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/admin" className="font-medium">
          Admin
        </Link>
        {title ? <span className="text-sm text-neutral-500">{title}</span> : null}
        <Link href="/" className="text-sm text-neutral-500">
          Home
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
