import { readFile } from "fs/promises";
import path from "path";
import type { Metadata } from "next";
import { getActivePopup } from "@/lib/store";

const ICONS: Record<string, { rel: string; type: string }> = {
  stonefruit: { rel: "popups/stonefruit/favicon.png", type: "image/png" },
  passion: { rel: "popups/passion/favicon.jpg", type: "image/jpeg" },
};

const TAB_TITLES: Record<string, string> = {
  stonefruit: "Get Stoned",
};

function iconForSlug(slug: string | null | undefined) {
  return ICONS[slug ?? ""] ?? ICONS.passion;
}

/** Browser tab title; popups can override their stored display name. */
export function popupTabTitle(
  slug: string | null | undefined,
  name: string | null | undefined
): string {
  if (slug && TAB_TITLES[slug]) return TAB_TITLES[slug];
  return name ?? "Bakery";
}

export function popupIconMetadata(
  slug: string | null | undefined
): NonNullable<Metadata["icons"]> {
  const href = `/${iconForSlug(slug).rel}`;
  return { icon: href, apple: href };
}

/** Favicon bytes for a popup slug, or the currently active popup. */
export async function popupIconResponse(slug?: string | null) {
  const resolved = slug ?? (await getActivePopup())?.slug;
  const icon = iconForSlug(resolved);
  const buf = await readFile(path.join(process.cwd(), "public", icon.rel));
  return new Response(buf, {
    headers: {
      "Content-Type": icon.type,
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
