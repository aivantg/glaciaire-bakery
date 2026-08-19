import Link from "next/link";
import { customerPath, ordersPath } from "@/lib/popups";
import { HostFooterLink } from "@/components/HostFooterLink";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";
import type { PopupLayoutProps } from "../types";
import "./stonefruit-ui.css";

export function StonefruitLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div className="stonefruit-root flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-5 pt-6 pb-2">
        <Link href={customerPath(slug, isHome)} className="sf-display text-2xl sm:text-3xl">
          stonefruit
        </Link>
        <Link href={ordersPath(slug, isHome)} className="sf-nav-pill">
          queue
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 pb-8">{children}</main>

      <footer className="flex flex-col items-center gap-3 px-5 pb-10 pt-4">
        <HostFooterLink />
        <MadeWithLoveLink />
      </footer>
    </div>
  );
}
