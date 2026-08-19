import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import type { PopupLayoutProps } from "../types";
import "./passion.css";

export function PassionLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div className="passion-root min-h-screen flex flex-col">
      <TopNav slug={slug} isHome={isHome} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
