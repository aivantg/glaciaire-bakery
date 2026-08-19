import { NextRequest, NextResponse } from "next/server";
import { createOrder, getAllOrders } from "@/lib/store";
import { resolvePopup } from "@/lib/popup-route";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { slug } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const orders = await getAllOrders(resolved.popup.id);
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest, { params }: Context) {
  const { slug } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const body = await request.json();
  const { items, customerName, notes } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Order must include at least one item" },
      { status: 400 }
    );
  }

  if (typeof customerName !== "string" || customerName.trim().length === 0) {
    return NextResponse.json(
      { error: "Please include a name on your order." },
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

  const result = await createOrder(resolved.popup.id, {
    items,
    customerName,
    notes,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result, { status: 201 });
}
