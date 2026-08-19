import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { lazydog, petitCochon } from "@/popups/stonefruit/load-fonts";
import "@/popups/stonefruit/stonefruit-ui.css";

export function HostShell({
  children,
  center = false,
}: {
  children: ReactNode;
  /** Vertically center main content (host login). */
  center?: boolean;
}) {
  return (
    <div
      className={`${lazydog.variable} ${petitCochon.variable} ${lazydog.className} stonefruit-root stonefruit-root--ops flex min-h-dvh flex-col`}
    >
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 pt-5 pb-2">
        <Link href="/admin" className="flex flex-col items-start leading-none">
          <span className="sf-brand-word">GLACIAIRE</span>
          <span className="mt-1 flex items-center gap-1.5 pl-1">
            <span className="sf-lazy text-white text-sm">x</span>
            <Image
              src="/stonefruit/domi-white.png"
              alt="domi"
              width={88}
              height={28}
              className="h-5 w-auto"
            />
          </span>
        </Link>
        <Link href="/" className="sf-nav-pill">
          home
        </Link>
      </header>
      <main
        className={`relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6 ${
          center ? "items-center justify-center" : ""
        }`}
      >
        {children}
      </main>
      <div className="sf-ground" aria-hidden />
    </div>
  );
}
