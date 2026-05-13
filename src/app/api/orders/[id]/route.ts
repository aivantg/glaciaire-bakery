import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatus, OrderStatus } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

const VALID_STATUSES: OrderStatus[] = ["pending", "in_progress", "done"];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const existing = await getOrderById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const updated = await updateOrderStatus(params.id, status);
  return NextResponse.json(updated);
}
