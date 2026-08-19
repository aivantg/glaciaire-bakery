import Link from "next/link";
import { customerPath, ordersPath } from "@/lib/popups";
import type { PopupLayoutProps } from "../types";

export function TemplateLayout({ slug, isHome, children }: PopupLayoutProps) {
  return (
    <div>
      <header>
        <Link href={customerPath(slug, isHome)}>{slug}</Link>
        {" · "}
        <Link href={ordersPath(slug, isHome)}>queue</Link>
      </header>
      <main>{children}</main>
    </div>
  );
}
