import { NextResponse } from "next/server";
import { isReservedSlug } from "./popups";
import { getPopupBySlug, type Popup } from "./store";

export async function resolvePopup(
  slug: string
): Promise<{ popup: Popup } | { error: NextResponse }> {
  if (isReservedSlug(slug)) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  const popup = await getPopupBySlug(slug);
  if (!popup) {
    return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  }
  return { popup };
}
