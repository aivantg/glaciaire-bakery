import Image from "next/image";
import Link from "next/link";
import { customerPath, ordersPath } from "@/lib/popups";
import { HostFooterLink } from "@/components/HostFooterLink";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";
import type { PopupLayoutProps } from "../types";
import { lazydog, petitCochon } from "./load-fonts";
import { StonefruitBasket } from "./StonefruitBasket";
import "./stonefruit-ui.css";

export function StonefruitLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div
      className={`${lazydog.variable} ${petitCochon.variable} ${lazydog.className} stonefruit-root flex min-h-dvh flex-col`}
    >
      <header className="relative z-10 mx-auto flex w-full max-w-lg items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <Link
          href={customerPath(slug, isHome)}
          className="flex flex-col items-start leading-none"
        >
          <span className="sf-brand-word">GLACIAIRE</span>
          <span className="mt-1 flex items-center gap-1.5 pl-1">
            <span className="sf-lazy text-white text-sm">x</span>
            <Image
              src="/stonefruit/domi-white.png"
              alt="domi"
              width={88}
              height={28}
              className="h-5 w-auto"
              priority
            />
          </span>
        </Link>
        <Link href={ordersPath(slug, isHome)} className="sf-nav-pill mt-1">
          queue
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg flex-1 px-4 pb-4 sm:px-5">
        {children}
      </main>

      <footer className="relative z-10 flex flex-col items-center gap-2 px-4 pb-3 pt-2">
        <HostFooterLink />
        <MadeWithLoveLink />
      </footer>

      <div className="sf-ground">
        <StonefruitBasket />
      </div>
    </div>
  );
}
