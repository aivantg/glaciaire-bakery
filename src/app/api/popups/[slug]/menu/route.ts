import { NextRequest, NextResponse } from "next/server";
import { createMenuItem, getAllMenuItems, type MenuCategory } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";
import { parseAddons, VALID_CATEGORIES } from "@/lib/menu-parse";
import { resolvePopup } from "@/lib/popup-route";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { slug } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const items = await getAllMenuItems(resolved.popup.id);
  return NextResponse.json(items);
}

export async function POST(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const body = await request.json();
  const { name, description, price, available, category, addons } = body;

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

  const item = await createMenuItem(resolved.popup.id, {
    name: name.trim(),
    description: (description ?? "").trim(),
    price: Math.round(price),
    available: available !== false,
    category: cat,
    addons: parseAddons(addons),
  });

  return NextResponse.json(item, { status: 201 });
}
