import { NextRequest, NextResponse } from "next/server";
import { getAllMenuItems, createMenuItem } from "@/lib/store";

export async function GET() {
  const items = getAllMenuItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, price, available } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json(
      { error: "Price must be a non-negative number (in cents)" },
      { status: 400 }
    );
  }

  const item = createMenuItem({
    name: name.trim(),
    description: (description ?? "").trim(),
    price: Math.round(price),
    available: available !== false,
  });

  return NextResponse.json(item, { status: 201 });
}
