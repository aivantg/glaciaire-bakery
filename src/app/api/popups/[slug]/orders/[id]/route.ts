import { NextRequest, NextResponse } from "next/server";
import {
  archiveOrder,
  deleteArchivedOrder,
  getOrderById,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";
import { resolvePopup } from "@/lib/popup-route";

const VALID_STATUSES: OrderStatus[] = ["pending", "in_progress", "done"];

type Context = { params: Promise<{ slug: string; id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { slug, id } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const order = await getOrderById(resolved.popup.id, id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug, id } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const existing = await getOrderById(resolved.popup.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status, archived } = body;

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }
    const updated = await updateOrderStatus(resolved.popup.id, id, status);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  if (typeof archived === "boolean") {
    const updated = await archiveOrder(resolved.popup.id, id, archived);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  return NextResponse.json(
    { error: "Request must include status or archived" },
    { status: 400 }
  );
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug, id } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const deleted = await deleteArchivedOrder(resolved.popup.id, id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Order not found or not archived" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
