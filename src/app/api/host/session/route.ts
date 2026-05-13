import { NextRequest, NextResponse } from "next/server";
import {
  HOST_COOKIE_NAME,
  HOST_SESSION_MS,
  createSessionCookieValue,
  isHostAuthenticatedRequest,
  pinMatches,
} from "@/lib/host-session";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: isHostAuthenticatedRequest(request),
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.HOST_PIN) {
    return NextResponse.json(
      { error: "Host login is not configured." },
      { status: 500 }
    );
  }
  const body = await request.json().catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!pinMatches(pin)) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  const res = NextResponse.json({ authenticated: true });
  res.cookies.set(HOST_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(HOST_SESSION_MS / 1000),
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.delete(HOST_COOKIE_NAME);
  return res;
}
