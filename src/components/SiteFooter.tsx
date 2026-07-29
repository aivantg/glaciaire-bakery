"use client";

import { usePathname } from "next/navigation";
import { HostFooterLink } from "@/components/HostFooterLink";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";

export function SiteFooter() {
  const pathname = usePathname();

  // Stonefruit is a full-bleed scenic experience with its own chrome.
  if (pathname?.startsWith("/stonefruit")) return null;

  return (
    <footer className="text-center pt-8 pb-10 px-4 flex flex-col items-center gap-3">
      <HostFooterLink />
      <MadeWithLoveLink />
    </footer>
  );
}
