import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminThemesPage() {
  return (
    <AdminPageShell
      badge="السمات"
      title="إدارة السمات"
      description="إدارة السمات والألوان والمظهر العام للمنصة"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "السمات" }]}
    >
      <AdminEmptyState
        icon={Palette}
        title="مركز السمات"
        description="قريبًا: إدارة الألوان، الأقسام، والإصدارات."
      />
    </AdminPageShell>
  );
}
