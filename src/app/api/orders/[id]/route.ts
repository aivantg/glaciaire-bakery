import { NextRequest, NextResponse } from "next/server";
import {
  getOrderById,
  updateOrderStatus,
  archiveOrder,
  deleteArchivedOrder,
  OrderStatus,
} from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

const VALID_STATUSES: OrderStatus[] = ["pending", "in_progress", "done"];

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getOrderById(id);
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
    const updated = await updateOrderStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  if (typeof archived === "boolean") {
    const updated = await archiveOrder(id, archived);
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
  const { id } = await params;
  const deleted = await deleteArchivedOrder(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Order not found or not archived" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
