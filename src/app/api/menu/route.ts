import { NextRequest, NextResponse } from "next/server";
import {
  getAllMenuItems,
  createMenuItem,
  MenuCategory,
  type MenuItemAddonInput,
} from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

const VALID_CATEGORIES: MenuCategory[] = ["cafe", "pastries"];

function parseAddons(body: unknown): MenuItemAddonInput[] | undefined {
  if (body === undefined) return undefined;
  if (!Array.isArray(body)) return undefined;
  const addons: MenuItemAddonInput[] = [];
  for (const raw of body) {
    if (!raw || typeof raw !== "object") continue;
    const { name, price, available } = raw as Record<string, unknown>;
    if (typeof name !== "string" || name.trim() === "") continue;
    let cents: number | null = null;
    if (typeof price === "number" && !Number.isNaN(price) && price >= 0) {
      cents = Math.round(price);
    }
    addons.push({
      name: name.trim(),
      price: cents,
      available: available !== false,
    });
  }
  return addons;
}

export async function GET() {
  const items = await getAllMenuItems();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

  const item = await createMenuItem({
    name: name.trim(),
    description: (description ?? "").trim(),
    price: Math.round(price),
    available: available !== false,
    category: cat,
    addons: parseAddons(addons),
  });

  return NextResponse.json(item, { status: 201 });
}
