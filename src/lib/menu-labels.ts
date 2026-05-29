import type { MenuCategory } from "@/lib/store";

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  cafe: "cafe",
  pastries: "pastries",
};

export const SECTION_ORDER: MenuCategory[] = ["cafe", "pastries"];
