import Link from "next/link";
import { customerPath } from "@/lib/popups";
import { HostModeTopLabel } from "@/components/HostModeTopLabel";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";
import type { PopupLayoutProps } from "../types";
import { honk, nunito } from "./load-fonts";
import { DiwaliNavPill } from "./DiwaliNavPill";
import "./diwali-ui.css";

export function DiwaliLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div
      className={`${honk.variable} ${nunito.variable} ${honk.className} diwali-root flex flex-col`}
    >
      <div className="dw-sky" aria-hidden />
      <div className="dw-stage">
        <header className="relative mx-auto flex w-full max-w-lg md:max-w-2xl lg:max-w-[min(70%,56rem)] items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <HostModeTopLabel className="dw-host-mode-top absolute left-1/2 top-5 sm:top-6 -translate-x-1/2 z-10 pointer-events-none" />
          <Link
            href={customerPath(slug, isHome)}
            className="flex flex-col items-start leading-none"
          >
            <span className="dw-brand-word">GLACIAIRE</span>
            <span className="dw-brand-sub">diwali popup</span>
          </Link>
          <DiwaliNavPill slug={slug} isHome={isHome} />
        </header>

        <main className="mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-[min(70%,56rem)] px-4 sm:px-5">
          {children}
        </main>
      </div>

      <div className="dw-ground">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/diwali/procession.png"
          alt=""
          className="dw-procession"
        />
        <footer className="dw-ground-footer">
          <MadeWithLoveLink slug={slug} />
        </footer>
      </div>
    </div>
  );
}
