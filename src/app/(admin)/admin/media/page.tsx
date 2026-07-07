import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { AdminEmptyState } from "@/components/layout/admin-empty-state";
import { Image } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <AdminPageShell
      badge="الوسائط"
      title="مدير الوسائط"
      description="رفع، إدارة، والبحث في جميع ملفات وصور المنصة"
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الوسائط" }]}
    >
      <AdminEmptyState
        icon={Image}
        title="مدير الوسائط"
        description="قريبًا: رفع، حذف، ضغط، تحويل WebP/AVIF، والبحث في الملفات."
      />
    </AdminPageShell>
  );
}
