import type { Metadata } from "next";
import { getActivePopup } from "@/lib/store";
import { popupIconMetadata } from "@/lib/popup-favicon";
import { PopupOrderApp } from "@/popups/PopupOrderApp";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const popup = await getActivePopup();
  return {
    title: popup?.name ?? "Bakery",
    description: "Pastry + cafe pop-up",
    icons: popupIconMetadata(popup?.slug),
  };
}

export default async function HomePage() {
  const popup = await getActivePopup();
  if (!popup) {
    return <p>No active popup is configured.</p>;
  }
  return <PopupOrderApp slug={popup.slug} isHome />;
}
