import { popupIconResponse } from "@/lib/popup-favicon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export default async function AppleIcon({ params }: Context) {
  const { slug } = await params;
  return popupIconResponse(slug);
}
