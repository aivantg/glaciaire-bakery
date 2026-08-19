/**
 * Data access layer for the bakery popup app.
 *
 * Backed by Postgres via Prisma. All functions return plain serializable
 * shapes (ISO strings for dates, cents for prices) so they can be returned
 * directly from API routes. Menu and order queries are scoped to a popup.
 */

import { prisma } from "./db";
import type {
  OrderStatus as PrismaOrderStatus,
  MenuCategory as PrismaMenuCategory,
} from "@prisma/client";

// ─── Types (kept stable for the client) ───────────────────────────────────────

export type MenuCategory = PrismaMenuCategory;

export interface Popup {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

export interface MenuItemAddon {
  id: string;
  name: string;
  price: number | null; // cents; null or 0 = no upcharge on menu
  available: boolean;
}

export interface MenuItemAddonInput {
  name: string;
  price: number | null; // cents
  available: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // cents
  available: boolean;
  archived: boolean;
  category: MenuCategory;
  decorator: string | null;
  createdAt: string;
  addons: MenuItemAddon[];
}

export interface OrderItemAddon {
  name: string;
  unitPrice: number; // cents
}

export interface OrderItem {
  menuItemId: string | null;
  menuItemName: string;
  quantity: number;
  unitPrice: number; // cents — base item price
  addons: OrderItemAddon[];
}

export type OrderStatus = PrismaOrderStatus;

export interface Order {
  id: string;
  items: OrderItem[];
  total: number; // cents
  status: OrderStatus;
  archived: boolean;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  items: {
    menuItemId: string;
    quantity: number;
    addonIds?: string[];
  }[];
  customerName?: string;
  notes?: string;
}

type MenuItemRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  archived: boolean;
  category: PrismaMenuCategory;
  decorator: string | null;
  createdAt: Date;
  addons: {
    id: string;
    name: string;
    price: number | null;
    available: boolean;
  }[];
};

type OrderWithItems = {
  id: string;
  customerName: string | null;
  notes: string | null;
  status: PrismaOrderStatus;
  archived: boolean;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  items: {
    menuItemId: string | null;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    addons: { name: string; unitPrice: number }[];
  }[];
};

const menuInclude = {
  addons: { orderBy: { name: "asc" as const } },
};

// ─── Serializers ──────────────────────────────────────────────────────────────

function serializePopup(row: {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}): Popup {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    isActive: row.isActive,
  };
}

function serializeMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    available: row.available,
    archived: row.archived,
    category: row.category,
    decorator: row.decorator,
    createdAt: row.createdAt.toISOString(),
    addons: row.addons.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
      available: a.available,
    })),
  };
}

function serializeOrder(row: OrderWithItems): Order {
  return {
    id: row.id,
    items: row.items.map((it) => ({
      menuItemId: it.menuItemId,
      menuItemName: it.menuItemName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      addons: it.addons.map((a) => ({
        name: a.name,
        unitPrice: a.unitPrice,
      })),
    })),
    total: row.total,
    status: row.status,
    archived: row.archived,
    customerName: row.customerName ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeAddonInputs(
  addons: MenuItemAddonInput[] | undefined
): MenuItemAddonInput[] {
  if (!addons) return [];
  return addons
    .map((a) => ({
      name: a.name.trim(),
      price: a.price == null ? null : Math.max(0, Math.round(a.price)),
      available: a.available !== false,
    }))
    .filter((a) => a.name.length > 0);
}

// ─── Popups ───────────────────────────────────────────────────────────────────

export async function getAllPopups(): Promise<Popup[]> {
  const rows = await prisma.popup.findMany({
    orderBy: { createdAt: "asc" },
  });
  return rows.map(serializePopup);
}

export async function getPopupBySlug(slug: string): Promise<Popup | null> {
  const row = await prisma.popup.findUnique({ where: { slug } });
  return row ? serializePopup(row) : null;
}

export async function getActivePopup(): Promise<Popup | null> {
  const row = await prisma.popup.findFirst({ where: { isActive: true } });
  return row ? serializePopup(row) : null;
}

export async function setActivePopup(
  slug: string
): Promise<Popup | { error: string }> {
  const target = await prisma.popup.findUnique({ where: { slug } });
  if (!target) return { error: "Popup not found" };

  await prisma.$transaction([
    prisma.popup.updateMany({
      where: { isActive: true, id: { not: target.id } },
      data: { isActive: false },
    }),
    prisma.popup.update({
      where: { id: target.id },
      data: { isActive: true },
    }),
  ]);

  return serializePopup({ ...target, isActive: true });
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

export async function getAllMenuItems(popupId: string): Promise<MenuItem[]> {
  const rows = await prisma.menuItem.findMany({
    where: { popupId, archived: false },
    orderBy: { createdAt: "asc" },
    include: menuInclude,
  });
  return rows.map(serializeMenuItem);
}

export async function getArchivedMenuItems(
  popupId: string
): Promise<MenuItem[]> {
  const rows = await prisma.menuItem.findMany({
    where: { popupId, archived: true },
    orderBy: { createdAt: "asc" },
    include: menuInclude,
  });
  return rows.map(serializeMenuItem);
}

export async function getMenuItemById(
  popupId: string,
  id: string
): Promise<MenuItem | null> {
  const row = await prisma.menuItem.findFirst({
    where: { id, popupId, archived: false },
    include: menuInclude,
  });
  return row ? serializeMenuItem(row) : null;
}

export async function createMenuItem(
  popupId: string,
  data: Omit<MenuItem, "id" | "createdAt" | "addons" | "archived"> & {
    addons?: MenuItemAddonInput[];
  }
): Promise<MenuItem> {
  const addonRows = normalizeAddonInputs(data.addons);
  const row = await prisma.menuItem.create({
    data: {
      popupId,
      name: data.name,
      description: data.description,
      price: data.price,
      available: data.available,
      category: data.category,
      decorator: data.decorator,
      addons: addonRows.length ? { create: addonRows } : undefined,
    },
    include: menuInclude,
  });
  return serializeMenuItem(row);
}

export async function updateMenuItem(
  popupId: string,
  id: string,
  data: Partial<Omit<MenuItem, "id" | "createdAt" | "addons" | "archived">> & {
    addons?: MenuItemAddonInput[];
  }
): Promise<MenuItem | null> {
  try {
    const existing = await prisma.menuItem.findFirst({
      where: { id, popupId },
    });
    if (!existing) return null;

    const { addons, ...itemFields } = data;
    const row = await prisma.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id },
        data: itemFields,
      });
      if (addons !== undefined) {
        await tx.menuItemAddon.deleteMany({ where: { menuItemId: id } });
        const addonRows = normalizeAddonInputs(addons);
        if (addonRows.length > 0) {
          await tx.menuItemAddon.createMany({
            data: addonRows.map((a) => ({ ...a, menuItemId: id })),
          });
        }
      }
      return tx.menuItem.findUniqueOrThrow({
        where: { id },
        include: menuInclude,
      });
    });
    return serializeMenuItem(row);
  } catch {
    return null;
  }
}

export async function archiveMenuItem(
  popupId: string,
  id: string
): Promise<boolean> {
  try {
    const result = await prisma.menuItem.updateMany({
      where: { id, popupId, archived: false },
      data: { archived: true, available: false },
    });
    return result.count > 0;
  } catch {
    return false;
  }
}

export async function unarchiveMenuItem(
  popupId: string,
  id: string
): Promise<MenuItem | null> {
  try {
    const result = await prisma.menuItem.updateMany({
      where: { id, popupId, archived: true },
      data: { archived: false },
    });
    if (result.count === 0) return null;
    const row = await prisma.menuItem.findUniqueOrThrow({
      where: { id },
      include: menuInclude,
    });
    return serializeMenuItem(row);
  } catch {
    return null;
  }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

const orderInclude = {
  items: { include: { addons: true } },
};

/** Active orders only — excludes soft-deleted rows. */
const orderNotDeleted = { deletedAt: null } as const;

/** Total units ordered per menu item (sum of line quantities). */
export async function getMenuItemOrderCounts(
  popupId: string
): Promise<Record<string, number>> {
  const rows = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: {
      menuItemId: { not: null },
      order: { ...orderNotDeleted, popupId },
    },
    _sum: { quantity: true },
  });
  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.menuItemId) {
      counts[row.menuItemId] = row._sum.quantity ?? 0;
    }
  }
  return counts;
}

export async function getAllOrders(popupId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { popupId, ...orderNotDeleted },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(serializeOrder);
}

export async function getOrderById(
  popupId: string,
  id: string
): Promise<Order | null> {
  const row = await prisma.order.findFirst({
    where: { id, popupId, ...orderNotDeleted },
    include: orderInclude,
  });
  return row ? serializeOrder(row) : null;
}

export async function createOrder(
  popupId: string,
  data: CreateOrderInput
): Promise<Order | { error: string }> {
  if (!data.items || data.items.length === 0) {
    return { error: "Order must have at least one item" };
  }

  const ids = Array.from(new Set(data.items.map((i) => i.menuItemId)));
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: ids }, popupId, archived: false },
    include: menuInclude,
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const resolvedItems: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
    addons: { name: string; unitPrice: number }[];
  }[] = [];
  let total = 0;

  for (const { menuItemId, quantity, addonIds = [] } of data.items) {
    const menuItem = byId.get(menuItemId);
    if (!menuItem) return { error: `Menu item ${menuItemId} not found` };
    if (!menuItem.available)
      return { error: `${menuItem.name} is not available` };
    if (quantity < 1) return { error: "Quantity must be at least 1" };

    const uniqueAddonIds = Array.from(new Set(addonIds));
    const addonById = new Map(menuItem.addons.map((a) => [a.id, a]));

    const selectedAddons: { name: string; unitPrice: number }[] = [];
    for (const addonId of uniqueAddonIds) {
      const addon = addonById.get(addonId);
      if (!addon) {
        return { error: `Add-on not found for ${menuItem.name}` };
      }
      if (!addon.available) {
        return { error: `${addon.name} is not available` };
      }
      selectedAddons.push({
        name: addon.name,
        unitPrice: addon.price ?? 0,
      });
    }

    const unitTotal =
      menuItem.price + selectedAddons.reduce((sum, a) => sum + a.unitPrice, 0);
    total += unitTotal * quantity;

    resolvedItems.push({
      menuItemId,
      menuItemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      addons: selectedAddons,
    });
  }

  const created = await prisma.order.create({
    data: {
      popupId,
      customerName: data.customerName,
      notes: data.notes,
      total,
      items: {
        create: resolvedItems.map((item) => ({
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          addons: item.addons.length ? { create: item.addons } : undefined,
        })),
      },
    },
    include: orderInclude,
  });

  return serializeOrder(created);
}

export async function updateOrderStatus(
  popupId: string,
  id: string,
  status: OrderStatus
): Promise<Order | null> {
  const result = await prisma.order.updateMany({
    where: { id, popupId, ...orderNotDeleted },
    data: { status },
  });
  if (result.count === 0) return null;
  return getOrderById(popupId, id);
}

export async function archiveOrder(
  popupId: string,
  id: string,
  archived: boolean
): Promise<Order | null> {
  const result = await prisma.order.updateMany({
    where: { id, popupId, ...orderNotDeleted },
    data: { archived },
  });
  if (result.count === 0) return null;
  return getOrderById(popupId, id);
}

/** Archives every done order that is not yet archived (the "finished" queue). */
export async function archiveAllFinishedOrders(
  popupId: string
): Promise<number> {
  const result = await prisma.order.updateMany({
    where: { popupId, status: "done", archived: false, ...orderNotDeleted },
    data: { archived: true },
  });
  return result.count;
}

/** Soft-deletes an archived order (sets deletedAt). */
export async function deleteArchivedOrder(
  popupId: string,
  id: string
): Promise<boolean> {
  const result = await prisma.order.updateMany({
    where: { id, popupId, archived: true, ...orderNotDeleted },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
