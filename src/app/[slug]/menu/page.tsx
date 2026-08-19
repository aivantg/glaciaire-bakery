import { notFound, redirect } from "next/navigation";
import { isReservedSlug } from "@/lib/popups";
import { getPopupBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

export default async function PopupMenuAliasPage({ params }: Context) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const popup = await getPopupBySlug(slug);
  if (!popup) notFound();
  redirect(`/admin?popup=${popup.slug}`);
}
