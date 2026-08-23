import Image from "next/image";
import Link from "next/link";
import { customerPath } from "@/lib/popups";
import { HostModeTopLabel } from "@/components/HostModeTopLabel";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";
import type { PopupLayoutProps } from "../types";
import { lazydog, petitCochon, nunito } from "./load-fonts";
import { StonefruitBasket } from "./StonefruitBasket";
import { StonefruitNavPill } from "./StonefruitNavPill";
import { StonefruitSkyFit } from "./StonefruitSkyFit";
import "./stonefruit-ui.css";

export function StonefruitLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div
      className={`${lazydog.variable} ${petitCochon.variable} ${nunito.variable} ${lazydog.className} stonefruit-root flex flex-col`}
    >
      <StonefruitSkyFit />
      <div className="sf-stage">
        <header className="relative mx-auto flex w-full max-w-lg md:max-w-2xl lg:max-w-[min(70%,56rem)] items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <HostModeTopLabel className="sf-host-mode-top absolute left-1/2 top-5 sm:top-6 -translate-x-1/2 z-10 pointer-events-none" />
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
          <StonefruitNavPill slug={slug} isHome={isHome} />
        </header>

        <main className="mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-[min(70%,56rem)] px-4 sm:px-5">
          {children}
        </main>
      </div>

      <div className="sf-ground">
        <footer className="sf-ground-footer">
          <MadeWithLoveLink slug={slug} />
        </footer>
        <StonefruitBasket />
      </div>
    </div>
  );
}
