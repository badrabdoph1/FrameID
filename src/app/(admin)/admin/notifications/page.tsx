import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminNotificationsPage() {
  return (
    <AdminPageShell
      badge="الإشعارات"
      title="الإشعارات"
      description="إدارة وإرسال الإشعارات للعملاء"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الإشعارات" }]}
    >
      <AdminEmptyState
        icon={Bell}
        title="مركز الإشعارات"
        description="قريبًا: إرسال إشعارات البريد، WhatsApp، وإشعارات الموقع."
      />
    </AdminPageShell>
  );
}
