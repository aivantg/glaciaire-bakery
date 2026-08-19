import { notFound } from "next/navigation";
import { customerPath, isReservedSlug } from "@/lib/popups";
import { getPopupBySlug } from "@/lib/store";
import { OrderQueueContent } from "@/components/orders/OrderQueueContent";
import { getPopupUI } from "@/popups/registry";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export default async function PopupOrdersPage({ params }: Context) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const popup = await getPopupBySlug(slug);
  if (!popup) notFound();

  const { Layout } = getPopupUI(popup.slug);

  return (
    <Layout slug={popup.slug} isHome={false}>
      <OrderQueueContent
        slug={popup.slug}
        menuPath={customerPath(popup.slug, false)}
      />
    </Layout>
  );
}
