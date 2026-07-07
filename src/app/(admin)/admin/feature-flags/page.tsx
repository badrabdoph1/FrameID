import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminFeatureFlagsPage() {
  return (
    <AdminModulePage
      badge="إدارة الميزات"
      title="الميزات"
      description="تشغيل أو إيقاف خصائص المنصة حسب العميل أو الموقع."
      items={[
        { label: "ميزات عامة", value: "تشغيل خصائص جديدة على مستوى المنصة." },
        { label: "ميزات عميل", value: "تجربة خاصية مع عميل محدد قبل الإطلاق العام." },
        { label: "ميزات موقع", value: "تفعيل إعداد لموقع واحد دون التأثير على الباقي." }
      ]}
    />
  );
}
