import { NextRequest, NextResponse } from "next/server";
import { getAllPopups, setActivePopup } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

export async function GET() {
  const popups = await getAllPopups();
  return NextResponse.json(popups);
}

export async function PATCH(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const result = await setActivePopup(slug);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }
  return NextResponse.json(result);
}
