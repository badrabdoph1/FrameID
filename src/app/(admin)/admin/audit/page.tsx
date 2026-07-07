import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminAuditPage() {
  return (
    <AdminModulePage
      badge="سجل المنصة"
      title="السجل"
      description="تتبع العمليات الحساسة داخل المنصة."
      items={[
        { label: "عمليات العملاء", value: "إنشاء وتعديل وتعليق حسابات العملاء." },
        { label: "عمليات الدفع", value: "قبول ورفض ومراجعة طلبات التفعيل." },
        { label: "عمليات الأمان", value: "الدخول، الجلسات، والصلاحيات الإدارية." }
      ]}
    />
  );
}
