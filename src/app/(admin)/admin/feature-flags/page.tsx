import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { Flag } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminFeatureFlagsPage() {
  return (
    <AdminPageShell
      badge="الميزات"
      title="ميزات التفعيل"
      description="إدارة ميزات المنصة وتفعيلها للعملاء"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الميزات" }]}
      tabs={[
        { id: "general", label: "عام" },
        { id: "customers", label: "حسب العميل" },
        { id: "sites", label: "حسب الموقع" },
      ]}
    >
      <AdminEmptyState
        icon={Flag}
        title="قريبًا"
        description="إدارة الميزات وتفعيلها قيد التطوير."
      />
    </AdminPageShell>
  );
}
