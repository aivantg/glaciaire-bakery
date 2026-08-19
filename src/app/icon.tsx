import { popupIconResponse } from "@/lib/popup-favicon";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Icon() {
  return popupIconResponse();
}
