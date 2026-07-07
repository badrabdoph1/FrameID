import { AdminModulePage } from "@/components/admin/shared/admin-module-page";

export const dynamic = "force-dynamic";

export default function AdminNotificationsPage() {
  return (
    <AdminModulePage
      badge="مركز الإشعارات"
      title="الإشعارات"
      description="إدارة رسائل العملاء والتنبيهات الخاصة بالاشتراك والتفعيل."
      items={[
        { label: "إشعارات التجربة", value: "تنبيهات قرب انتهاء التجربة المجانية." },
        { label: "إشعارات الدفع", value: "رسائل قبول أو رفض إثبات الدفع." },
        { label: "إشعارات النظام", value: "رسائل الصيانة والتحديثات المهمة." }
      ]}
    />
  );
}
