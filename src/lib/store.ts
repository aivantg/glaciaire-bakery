/**
 * In-memory data store for the bakery popup app.
 *
 * This module provides a simple in-memory store using module-level singletons.
 * Data persists as long as the server is running but resets on restart.
 *
 * TO MIGRATE TO PRISMA:
 * 1. Run `npx prisma init`
 * 2. Add MenuItem and Order models to prisma/schema.prisma
 * 3. Replace the functions below with Prisma client calls
 * 4. The function signatures (inputs/outputs) stay the same — only the internals change
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in cents to avoid float issues
  available: boolean;
  createdAt: string;
}

export interface OrderItem {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  unitPrice: number; // in cents
}

export type OrderStatus = "pending" | "in_progress" | "done";

export interface Order {
  id: string;
  items: OrderItem[];
  total: number; // in cents
  status: OrderStatus;
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

let menuItems: MenuItem[] = [
  {
    id: "seed-1",
    name: "Croissant",
    description: "Buttery, flaky French pastry",
    price: 350,
    available: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    name: "Sourdough Loaf",
    description: "Naturally leavened with a crisp crust",
    price: 1200,
    available: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-3",
    name: "Blueberry Muffin",
    description: "Loaded with fresh blueberries",
    price: 400,
    available: true,
    createdAt: new Date().toISOString(),
  },
];

let orders: Order[] = [];

// ─── ID generator ─────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Menu functions ───────────────────────────────────────────────────────────

export function getAllMenuItems(): MenuItem[] {
  return [...menuItems];
}

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === id);
}

export function createMenuItem(
  data: Omit<MenuItem, "id" | "createdAt">
): MenuItem {
  const item: MenuItem = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  menuItems.push(item);
  return item;
}

export function updateMenuItem(
  id: string,
  data: Partial<Omit<MenuItem, "id" | "createdAt">>
): MenuItem | null {
  const index = menuItems.findIndex((item) => item.id === id);
  if (index === -1) return null;
  menuItems[index] = { ...menuItems[index], ...data };
  return menuItems[index];
}

export function deleteMenuItem(id: string): boolean {
  const before = menuItems.length;
  menuItems = menuItems.filter((item) => item.id !== id);
  return menuItems.length < before;
}

// ─── Order functions ──────────────────────────────────────────────────────────

export function getAllOrders(): Order[] {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((order) => order.id === id);
}

export interface CreateOrderInput {
  items: { menuItemId: string; quantity: number }[];
  customerName?: string;
  notes?: string;
}

export function createOrder(data: CreateOrderInput): Order | { error: string } {
  const resolvedItems: OrderItem[] = [];
  let total = 0;

  for (const { menuItemId, quantity } of data.items) {
    const menuItem = getMenuItemById(menuItemId);
    if (!menuItem) return { error: `Menu item ${menuItemId} not found` };
    if (!menuItem.available)
      return { error: `${menuItem.name} is not available` };
    if (quantity < 1) return { error: "Quantity must be at least 1" };

    resolvedItems.push({
      menuItemId,
      menuItemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
    });
    total += menuItem.price * quantity;
  }

  if (resolvedItems.length === 0) return { error: "Order must have at least one item" };

  const now = new Date().toISOString();
  const order: Order = {
    id: generateId(),
    items: resolvedItems,
    total,
    status: "pending",
    customerName: data.customerName,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };

  orders.push(order);
  return order;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus
): Order | null {
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;
  orders[index] = {
    ...orders[index],
    status,
    updatedAt: new Date().toISOString(),
  };
  return orders[index];
}
