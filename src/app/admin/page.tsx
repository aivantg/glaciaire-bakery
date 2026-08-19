import { AdminPageContent } from "@/components/admin/AdminPageContent";

type Context = { searchParams: Promise<{ popup?: string }> };

export default async function AdminPage({ searchParams }: Context) {
  const { popup } = await searchParams;
  return <AdminPageContent initialSlug={popup} />;
}
