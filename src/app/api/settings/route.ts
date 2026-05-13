import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings } from "@/lib/store";
import { isHostAuthenticatedRequest } from "@/lib/host-session";

// Venmo handles are 5–30 chars, alphanumerics plus _ and -. Accept a leading
// @ in input but store the bare handle.
function normalizeVenmoHandle(raw: string): string | { error: string } {
  const trimmed = raw.trim().replace(/^@/, "");
  if (trimmed === "") return "";
  if (!/^[A-Za-z0-9_-]{5,30}$/.test(trimmed)) {
    return {
      error: "Venmo handle must be 5–30 letters, numbers, dashes or underscores.",
    };
  }
  return trimmed;
}

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  if (!isHostAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const update: { venmoHandle?: string } = {};

  if (body.venmoHandle !== undefined) {
    if (typeof body.venmoHandle !== "string") {
      return NextResponse.json(
        { error: "venmoHandle must be a string" },
        { status: 400 }
      );
    }
    const normalized = normalizeVenmoHandle(body.venmoHandle);
    if (typeof normalized !== "string") {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }
    update.venmoHandle = normalized;
  }

  const settings = await updateSiteSettings(update);
  return NextResponse.json(settings);
}
