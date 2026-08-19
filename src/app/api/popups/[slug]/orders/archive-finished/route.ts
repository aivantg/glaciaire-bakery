import { NextRequest, NextResponse } from "next/server";
import { archiveAllFinishedOrders } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";
import { resolvePopup } from "@/lib/popup-route";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const count = await archiveAllFinishedOrders(resolved.popup.id);
  return NextResponse.json({ count });
}
