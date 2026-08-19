export const RESERVED_SLUGS = [
  "admin",
  "api",
  "host",
  "menu",
  "orders",
  "order",
] as const;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug);
}

export function customerPath(slug: string, isHome: boolean): string {
  return isHome ? "/" : `/${slug}`;
}

export function ordersPath(slug: string, isHome: boolean): string {
  return isHome ? "/orders" : `/${slug}/orders`;
}

export function popupApiBase(slug: string): string {
  return `/api/popups/${slug}`;
}
