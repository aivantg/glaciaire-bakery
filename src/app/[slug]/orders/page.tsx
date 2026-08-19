import { notFound } from "next/navigation";
import { customerPath, isReservedSlug } from "@/lib/popups";
import { getPopupBySlug } from "@/lib/store";
import { OrderQueueContent } from "@/components/orders/OrderQueueContent";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export default async function PopupOrdersPage({ params }: Context) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const popup = await getPopupBySlug(slug);
  if (!popup) notFound();

  return (
    <OrderQueueContent
      slug={popup.slug}
      popupName={popup.name}
      menuPath={customerPath(popup.slug, false)}
    />
  );
}
