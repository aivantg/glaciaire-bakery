/**
 * Data access layer for the bakery popup app.
 *
 * Backed by Postgres via Prisma. All functions return plain serializable
 * shapes (ISO strings for dates, cents for prices) so they can be returned
 * directly from API routes.
 */

import { prisma } from "./db";
import type {
  OrderStatus as PrismaOrderStatus,
  MenuCategory as PrismaMenuCategory,
} from "@prisma/client";

// ─── Types (kept stable for the client) ───────────────────────────────────────

export type MenuCategory = PrismaMenuCategory;

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  available: boolean;
  category: MenuCategory;
  createdAt: string;
}

export interface OrderItem {
  menuItemId: string | null;
  menuItemName: string;
  quantity: number;
  unitPrice: number; // cents
}

export type OrderStatus = PrismaOrderStatus;

export interface Order {
  id: string;
  items: OrderItem[];
  total: number; // cents
  status: OrderStatus;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: { menuItemId: string; quantity: number }[];
  customerName?: string;
  notes?: string;
}

// ─── Serializers ──────────────────────────────────────────────────────────────

function serializeMenuItem(row: {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  category: PrismaMenuCategory;
  createdAt: Date;
}): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    available: row.available,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
  };
}

type OrderWithItems = {
  id: string;
  customerName: string | null;
  notes: string | null;
  status: PrismaOrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: {
    menuItemId: string | null;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
  }[];
};

function serializeOrder(row: OrderWithItems): Order {
  return {
    id: row.id,
    items: row.items.map((it) => ({
      menuItemId: it.menuItemId,
      menuItemName: it.menuItemName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    total: row.total,
    status: row.status,
    customerName: row.customerName ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export async function getAllMenuItems(): Promise<MenuItem[]> {
  const rows = await prisma.menuItem.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(serializeMenuItem);
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const row = await prisma.menuItem.findUnique({ where: { id } });
  return row ? serializeMenuItem(row) : null;
}

export async function createMenuItem(
  data: Omit<MenuItem, "id" | "createdAt">
): Promise<MenuItem> {
  const row = await prisma.menuItem.create({ data });
  return serializeMenuItem(row);
}

export async function updateMenuItem(
  id: string,
  data: Partial<Omit<MenuItem, "id" | "createdAt">>
): Promise<MenuItem | null> {
  try {
    const row = await prisma.menuItem.update({ where: { id }, data });
    return serializeMenuItem(row);
  } catch {
    return null;
  }
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  try {
    await prisma.menuItem.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getAllOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const row = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  return row ? serializeOrder(row) : null;
}

export async function createOrder(
  data: CreateOrderInput
): Promise<Order | { error: string }> {
  if (!data.items || data.items.length === 0) {
    return { error: "Order must have at least one item" };
  }

  // Look up all referenced menu items in one query and validate.
  const ids = Array.from(new Set(data.items.map((i) => i.menuItemId)));
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const resolvedItems: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
  }[] = [];
  let total = 0;

  for (const { menuItemId, quantity } of data.items) {
    const menuItem = byId.get(menuItemId);
    if (!menuItem) return { error: `Menu item ${menuItemId} not found` };
    if (!menuItem.available) return { error: `${menuItem.name} is not available` };
    if (quantity < 1) return { error: "Quantity must be at least 1" };

    resolvedItems.push({
      menuItemId,
      menuItemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
    });
    total += menuItem.price * quantity;
  }

  const created = await prisma.order.create({
    data: {
      customerName: data.customerName,
      notes: data.notes,
      total,
      items: { create: resolvedItems },
    },
    include: { items: true },
  });

  return serializeOrder(created);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  try {
    const row = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return serializeOrder(row);
  } catch {
    return null;
  }
}

