import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <AdminPageShell
      title="التحليلات"
      description="إحصائيات وأداء المنصة"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "التحليلات" }]}
    >
      <AdminEmptyState
        icon={BarChart3}
        title="قريبًا"
        description="لوحة التحليلات قيد التطوير. ستتمكن من مشاهدة إحصائيات الزوار، الإيرادات، ونشاط المنصة."
      />
    </AdminPageShell>
  );
}
