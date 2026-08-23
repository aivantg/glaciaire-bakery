import { TopNav } from "@/components/TopNav";
import { HostModeTopLabel } from "@/components/HostModeTopLabel";
import { SiteFooter } from "@/components/SiteFooter";
import type { PopupLayoutProps } from "../types";
import "./passion.css";

export function PassionLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div className="passion-root min-h-screen flex flex-col">
      <div className="relative">
        <HostModeTopLabel className="absolute left-1/2 top-3 sm:top-3.5 -translate-x-1/2 z-10 pointer-events-none font-mono text-xs text-ink-500" />
        <TopNav slug={slug} isHome={isHome} />
      </div>
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {children}
      </main>
      <SiteFooter slug={slug} />
    </div>
  );
}
