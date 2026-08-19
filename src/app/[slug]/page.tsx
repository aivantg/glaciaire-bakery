import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isReservedSlug } from "@/lib/popups";
import { popupIconMetadata, popupTabTitle } from "@/lib/popup-favicon";
import { getPopupBySlug } from "@/lib/store";
import { PopupOrderApp } from "@/popups/PopupOrderApp";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: Context): Promise<Metadata> {
  const { slug } = await params;
  const popup = await getPopupBySlug(slug);
  return {
    title: popupTabTitle(popup?.slug ?? slug, popup?.name),
    description: "Pastry + cafe pop-up",
    icons: popupIconMetadata(popup?.slug ?? slug),
  };
}

export default async function PopupPage({ params }: Context) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const popup = await getPopupBySlug(slug);
  if (!popup) notFound();
  return <PopupOrderApp slug={popup.slug} isHome={false} />;
}
