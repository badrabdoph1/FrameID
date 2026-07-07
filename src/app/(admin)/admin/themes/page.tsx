import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminThemesPage() {
  return (
    <AdminModulePage
      badge="محرك السمات"
      title="السمات"
      description="إدارة محرك التصميم والإعدادات التقنية للقوالب."
      items={[
        { label: "الألوان", value: "إعدادات الهوية البصرية الافتراضية لكل سمة." },
        { label: "الأقسام", value: "تحديد الأقسام المدعومة مثل المعرض والباقات والتواصل." },
        { label: "الإصدارات", value: "متابعة إصدارات السمات دون كسر مواقع العملاء." }
      ]}
    />
  );
}
