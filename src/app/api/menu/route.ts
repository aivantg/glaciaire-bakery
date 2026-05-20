import { NextRequest, NextResponse } from "next/server";
import { getAllMenuItems, createMenuItem, MenuCategory } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

const VALID_CATEGORIES: MenuCategory[] = ["cafe", "pastries"];

export async function GET() {
  const items = await getAllMenuItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { name, description, price, available, category } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json(
      { error: "Price must be a non-negative number (in cents)" },
      { status: 400 }
    );
  }
  const cat: MenuCategory =
    category && VALID_CATEGORIES.includes(category) ? category : "pastries";

  const item = await createMenuItem({
    name: name.trim(),
    description: (description ?? "").trim(),
    price: Math.round(price),
    available: available !== false,
    category: cat,
  });

  return NextResponse.json(item, { status: 201 });
}
