import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminTemplatesPage() {
  return (
    <AdminModulePage
      badge="إدارة القوالب"
      title="القوالب"
      description="إدارة القوالب المنشورة والمسودات ومعاينات القوالب."
      items={[
        { label: "القوالب المنشورة", value: "القوالب التي تظهر في معرض القوالب للمصورين." },
        { label: "المعاينات", value: "بيانات وصور المعاينة الحية لكل قالب." },
        { label: "الاستخدام", value: "ربط القالب المختار بإنشاء موقع العميل تلقائيًا." }
      ]}
    />
  );
}
