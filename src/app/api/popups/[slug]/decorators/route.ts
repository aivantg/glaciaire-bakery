import { NextResponse } from "next/server";
import { listPopupDecorators } from "@/lib/decorators";
import { resolvePopup } from "@/lib/popup-route";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { slug } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;
  return NextResponse.json(listPopupDecorators(resolved.popup.slug));
}
