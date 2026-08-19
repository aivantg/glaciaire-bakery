import type { ReactNode } from "react";
import { PassionLayout } from "./passion/PassionLayout";
import { PassionOrderPage } from "./passion/PassionOrderPage";
import { TemplateLayout } from "./template/TemplateLayout";
import { TemplateOrderPage } from "./template/TemplateOrderPage";
import { StonefruitLayout } from "./stonefruit/StonefruitLayout";
import { StonefruitOrderPage } from "./stonefruit/StonefruitOrderPage";
import type { PopupLayoutProps, PopupOrderPageProps } from "./types";

export type PopupUI = {
  Layout: (props: PopupLayoutProps) => ReactNode;
  OrderPage: (props: PopupOrderPageProps) => ReactNode;
};

const TEMPLATE_UI: PopupUI = {
  Layout: TemplateLayout,
  OrderPage: TemplateOrderPage,
};

export const POPUP_UIS: Record<string, PopupUI> = {
  passion: {
    Layout: PassionLayout,
    OrderPage: PassionOrderPage,
  },
  stonefruit: {
    Layout: StonefruitLayout,
    OrderPage: StonefruitOrderPage,
  },
};

export function getPopupUI(slug: string): PopupUI {
  return POPUP_UIS[slug] ?? TEMPLATE_UI;
}
