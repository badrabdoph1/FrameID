import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminMarketingPage() {
  return (
    <AdminPageShell
      badge="التسويق"
      title="إدارة التسويق"
      description="إدارة الصفحة الرئيسية، القوالب التسويقية، وتحسين محركات البحث"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "التسويق" }]}
    >
      <AdminEmptyState
        icon={Megaphone}
        title="قريبًا"
        description="مركز التسويق قيد التطوير."
      />
    </AdminPageShell>
  );
}
