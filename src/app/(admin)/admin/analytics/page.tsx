import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <AdminModulePage
      badge="تحليلات المنصة"
      title="التحليلات"
      description="قراءة نمو المنصة واستخدام العملاء ومسارات التفعيل."
      items={[
        { label: "رحلة التسجيل", value: "قياس مشاهدة القوالب، فتح المعاينة، وإنشاء الحساب." },
        { label: "نشاط العملاء", value: "متابعة المواقع النشطة والتعديلات ورفع الصور." },
        { label: "الإيرادات", value: "ربط طلبات الدفع والتحويلات بحالة الاشتراكات." }
      ]}
    />
  );
}
