"use client";

import { HostFooterLink } from "@/components/HostFooterLink";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";

export function SiteFooter() {
  return (
    <footer className="text-center pt-8 pb-10 px-4 flex flex-col items-center gap-3">
      <HostFooterLink />
      <MadeWithLoveLink />
    </footer>
  );
}
