import { NextRequest, NextResponse } from "next/server";
import { getArchivedMenuItems } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

export async function GET(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getArchivedMenuItems();
  return NextResponse.json(items);
}
