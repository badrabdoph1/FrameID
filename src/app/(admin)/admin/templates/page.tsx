import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { Layout } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminTemplatesPage() {
  return (
    <AdminPageShell
      badge="القوالب"
      title="Theme Builder"
      description="إنشاء وتعديل وإدارة قوالب المنصة"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "القوالب" }]}
    >
      <AdminEmptyState
        icon={Layout}
        title="منشئ القوالب"
        description="قريبًا: إنشاء، تعديل، حذف، نشر، Clone، Duplicate، معاينة، وإدارة إصدارات القوالب."
      />
    </AdminPageShell>
  );
}
