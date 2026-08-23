import type { MenuCategory } from "@/lib/store";

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  cafe: "drinks",
  pastries: "pastries",
};

export const SECTION_ORDER: MenuCategory[] = ["pastries", "cafe"];
