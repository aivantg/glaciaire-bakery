import { NextRequest, NextResponse } from "next/server";
import { archiveAllFinishedOrders } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

export async function POST(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await archiveAllFinishedOrders();
  return NextResponse.json({ count });
}
