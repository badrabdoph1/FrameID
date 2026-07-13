import { notFound } from "next/navigation";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { PageStudioEditor } from "@/components/page-studio/page-studio-editor";
import { PAGE_DEFINITIONS } from "@/modules/page-studio/registry";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

interface PageStudioEditorPageProps {
  params: Promise<{ pageId: string }>;
}

export const dynamic = "force-dynamic";

export default async function PageStudioEditorPage({ params }: PageStudioEditorPageProps) {
  const { pageId } = await params;
  const pageDef = PAGE_DEFINITIONS.find((d) => d.id === pageId);

  if (!pageDef) {
    notFound();
  }

  await requireAdminPermission("page-studio", "edit");

  return (
    <AdminPageShell
      badge={pageDef.label}
      title={pageDef.label}
      description={pageDef.description}
      breadcrumbs={[
        { label: "القيادة", href: "/admin" },
        { label: "محرر الصفحات", href: "/admin/page-studio" },
        { label: pageDef.label },
      ]}
    >
      <PageStudioEditor pageId={pageId} />
    </AdminPageShell>
  );
}