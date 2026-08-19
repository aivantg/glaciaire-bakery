"use client";

import { ordersPath } from "@/lib/popups";
import { getPopupUI } from "./registry";

export function PopupOrderApp({
  slug,
  isHome,
}: {
  slug: string;
  isHome: boolean;
}) {
  const { Layout, OrderPage } = getPopupUI(slug);
  return (
    <Layout slug={slug} isHome={isHome}>
      <OrderPage slug={slug} ordersPath={ordersPath(slug, isHome)} />
    </Layout>
  );
}
