import { NextRequest, NextResponse } from "next/server";
import { getMenuItemOrderCounts } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

export async function GET(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const counts = await getMenuItemOrderCounts();
  return NextResponse.json(counts);
}
