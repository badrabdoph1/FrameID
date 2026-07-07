import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminMarketingPage() {
  return (
    <AdminModulePage
      badge="تسويق المنصة"
      title="التسويق"
      description="إدارة الرسائل التسويقية التي تشرح FrameID للمصورين."
      items={[
        { label: "الصفحة الرئيسية", value: "تحديث الوعد، الرحلة، ودعوات الإجراء." },
        { label: "القوالب", value: "إبراز القوالب والمعاينات الحية." },
        { label: "SEO", value: "تحسين ظهور المنصة للمصورين الباحثين عن موقع احترافي." }
      ]}
    />
  );
}
