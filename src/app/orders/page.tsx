import { customerPath } from "@/lib/popups";
import { getActivePopup } from "@/lib/store";
import { OrderQueueContent } from "@/components/orders/OrderQueueContent";

export const dynamic = "force-dynamic";

export default async function OrdersAliasPage() {
  const popup = await getActivePopup();
  if (!popup) {
    return <p>No active popup is configured.</p>;
  }

  return (
    <OrderQueueContent
      slug={popup.slug}
      popupName={popup.name}
      menuPath={customerPath(popup.slug, true)}
    />
  );
}
