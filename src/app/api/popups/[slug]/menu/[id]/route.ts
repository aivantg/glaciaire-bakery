import { NextRequest, NextResponse } from "next/server";
import {
  archiveMenuItem,
  getMenuItemById,
  unarchiveMenuItem,
  updateMenuItem,
} from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";
import { parseAddons, VALID_CATEGORIES } from "@/lib/menu-parse";
import { resolvePopup } from "@/lib/popup-route";

type Context = { params: Promise<{ slug: string; id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { slug, id } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const item = await getMenuItemById(resolved.popup.id, id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug, id } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const body = await request.json();
  const { name, description, price, available, category, addons, archived } =
    body;

  if (archived === false) {
    const item = await unarchiveMenuItem(resolved.popup.id, id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  }

  const existing = await getMenuItemById(resolved.popup.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: Parameters<typeof updateMenuItem>[2] = {};
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
  if (addons !== undefined) {
    updates.addons = parseAddons(addons) ?? [];
  }

  const updated = await updateMenuItem(resolved.popup.id, id, updates);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: Context) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug, id } = await params;
  const resolved = await resolvePopup(slug);
  if ("error" in resolved) return resolved.error;

  const archived = await archiveMenuItem(resolved.popup.id, id);
  if (!archived) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
