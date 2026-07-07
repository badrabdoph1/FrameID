import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { ClipboardList } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminAuditPage() {
  return (
    <AdminPageShell
      badge="التدقيق"
      title="سجل التدقيق"
      description="سجل أحداث وإجراءات المنصة"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "سجل التدقيق" }]}
    >
      <AdminEmptyState
        icon={ClipboardList}
        title="قريبًا"
        description="سجل أحداث المنصة قيد التطوير."
      />
    </AdminPageShell>
  );
}
