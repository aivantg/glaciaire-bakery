/**
 * Host PIN session: stateless, signed cookie.
 *
 * The cookie value is "<expiry-ms>.<hmac-sha256(expiry-ms)>" so the server can
 * verify it without any storage — tampering invalidates the HMAC, and an old
 * cookie auto-expires when its embedded timestamp passes.
 */

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const HOST_COOKIE_NAME = "glaciare_host";
export const HOST_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  // Prefer a dedicated secret. Fall back to deriving from PIN so the deploy
  // works with just HOST_PIN set, but warn loudly in production.
  const secret =
    process.env.HOST_SESSION_SECRET ||
    (process.env.HOST_PIN ? `glaciare:${process.env.HOST_PIN}` : "");
  if (!secret) {
    throw new Error(
      "Set HOST_PIN (and ideally HOST_SESSION_SECRET) to enable host login."
    );
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function createSessionCookieValue(): string {
  const expiry = Date.now() + HOST_SESSION_MS;
  const value = String(expiry);
  return `${value}.${sign(value)}`;
}

function verifyCookieValue(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot <= 0) return false;
  const value = cookieValue.slice(0, dot);
  const signature = cookieValue.slice(dot + 1);

  let expected: string;
  try {
    expected = sign(value);
  } catch {
    return false;
  }
  if (!safeEqual(signature, expected)) return false;

  const expiry = Number(value);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  return true;
}

/** Use from Server Components / Route Handlers (reads request cookies). */
export function isHostAuthenticated(): boolean {
  const cookie = cookies().get(HOST_COOKIE_NAME)?.value;
  return verifyCookieValue(cookie);
}

/** Use from Route Handlers that need the `NextRequest` directly. */
export function isHostAuthenticatedRequest(request: NextRequest): boolean {
  const cookie = request.cookies.get(HOST_COOKIE_NAME)?.value;
  return verifyCookieValue(cookie);
}

/** Constant-time PIN compare. */
export function pinMatches(submitted: string): boolean {
  const expected = process.env.HOST_PIN;
  if (!expected || typeof submitted !== "string") return false;
  if (submitted.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));
  } catch {
    return false;
  }
}
