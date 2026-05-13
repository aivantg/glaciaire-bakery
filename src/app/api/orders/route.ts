import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder } from "@/lib/store";

export async function GET() {
  const orders = await getAllOrders();
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { items, customerName, notes } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Order must include at least one item" },
      { status: 400 }
    );
  }

  for (const item of items) {
    if (!item.menuItemId || typeof item.menuItemId !== "string") {
      return NextResponse.json(
        { error: "Each item must have a valid menuItemId" },
        { status: 400 }
      );
    }
    if (typeof item.quantity !== "number" || item.quantity < 1) {
      return NextResponse.json(
        { error: "Each item must have a quantity of at least 1" },
        { status: 400 }
      );
    }
  }

  const result = await createOrder({ items, customerName, notes });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
