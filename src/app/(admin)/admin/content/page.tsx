import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminContentPage() {
  return (
    <AdminModulePage
      badge="محتوى المنصة"
      title="المحتوى"
      description="إدارة النصوص والصفحات التي تظهر في المنصة ومواقع العملاء."
      items={[
        {
          label: "النصوص",
          value: "تحكم في عناوين الصفحة الرئيسية، وصف الرحلة، ورسائل التجربة."
        },
        {
          label: "صفحات المنصة",
          value: "إدارة الصفحات القانونية، صفحات التسويق، ومحتوى الدعم."
        },
        {
          label: "محتوى العملاء",
          value: "مراجعة محتوى المواقع عند الحاجة دون الدخول إلى لوحة المصور."
        }
      ]}
    />
  );
}
