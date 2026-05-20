import { NextRequest, NextResponse } from "next/server";
import {
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  MenuCategory,
} from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

const VALID_CATEGORIES: MenuCategory[] = ["cafe", "pastries"];

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const item = await getMenuItemById(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getMenuItemById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, price, available, category } = body;

  const updates: Parameters<typeof updateMenuItem>[1] = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = name.trim();
  }
  if (description !== undefined) updates.description = String(description).trim();
  if (price !== undefined) {
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number (in cents)" },
        { status: 400 }
      );
    }
    updates.price = Math.round(price);
  }
  if (available !== undefined) updates.available = Boolean(available);
  if (category !== undefined) {
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }
    updates.category = category;
  }

  const updated = await updateMenuItem(id, updates);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deleted = await deleteMenuItem(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
