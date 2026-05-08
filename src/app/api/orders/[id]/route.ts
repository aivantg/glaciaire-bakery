import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatus, OrderStatus } from "@/lib/store";

const VALID_STATUSES: OrderStatus[] = ["pending", "in_progress", "done"];

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = getOrderById(params.id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = getOrderById(params.id);
  if (!order) {
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

  const updated = updateOrderStatus(params.id, status);
  return NextResponse.json(updated);
}
