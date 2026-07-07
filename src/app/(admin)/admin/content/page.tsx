import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة المحتوى"
      description="إدارة محتوى المنصة: النصوص، الصفحات، والرسائل"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "المحتوى" }]}
    >
      <AdminEmptyState
        icon={FileText}
        title="مركز المحتوى"
        description="إدارة الصفحات الرئيسية، النصوص، الأزرار، الفوتر، الهيدر، SEO، صفحات الخصوصية، الشروط، رسائل النظام، البريد، WhatsApp، والإشعارات."
      />
    </AdminPageShell>
  );
}
