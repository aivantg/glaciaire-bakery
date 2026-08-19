import { redirect } from "next/navigation";
import { getActivePopup } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MenuAliasPage() {
  const popup = await getActivePopup();
  redirect(popup ? `/admin?popup=${popup.slug}` : "/admin");
}
