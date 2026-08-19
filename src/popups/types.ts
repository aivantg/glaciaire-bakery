import type { ReactNode } from "react";

export type PopupLayoutProps = {
  slug: string;
  isHome: boolean;
  children: ReactNode;
};

export type PopupOrderPageProps = {
  slug: string;
  ordersPath: string;
};
