import { customerPath } from "@/lib/popups";
import { getActivePopup } from "@/lib/store";
import { OrderQueueContent } from "@/components/orders/OrderQueueContent";
import { getPopupUI } from "@/popups/registry";

export const dynamic = "force-dynamic";

export default async function OrdersAliasPage() {
  const popup = await getActivePopup();
  if (!popup) {
    return <p>No active popup is configured.</p>;
  }

  const { Layout } = getPopupUI(popup.slug);

  return (
    <Layout slug={popup.slug} isHome>
      <OrderQueueContent
        slug={popup.slug}
        menuPath={customerPath(popup.slug, true)}
      />
    </Layout>
  );
}
