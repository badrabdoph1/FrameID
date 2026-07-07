import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <AdminModulePage
      badge="مكتبة الوسائط"
      title="الوسائط"
      description="مراقبة الصور والملفات المرفوعة على مستوى المنصة."
      items={[
        { label: "صور العملاء", value: "متابعة الملفات المرفوعة لكل عميل وموقع." },
        { label: "صور القوالب", value: "إدارة صور المعاينات والمواد الافتراضية." },
        { label: "إثباتات الدفع", value: "ربط صور الإثبات بمراجعة المدفوعات." }
      ]}
    />
  );
}
