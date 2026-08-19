import { NextRequest, NextResponse } from "next/server";
import { moveMenuItem } from "@/lib/store";
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

  const body = await request.json();
  const { id, direction } = body as {
    id?: string;
    direction?: string;
  };

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json(
      { error: "direction must be up or down" },
      { status: 400 }
    );
  }

  const items = await moveMenuItem(resolved.popup.id, id, direction);
  if (!items) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  }
  return NextResponse.json(items);
}
