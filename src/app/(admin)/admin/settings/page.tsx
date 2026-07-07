import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireSuperAdminSession();

  return (
    <CenterPageShell
      badge="الإعدادات"
      title="إعدادات المنصة"
      description="تكوين وإعدادات المنصة العامة."
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: "الإعدادات" }]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">عام</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40">اسم المنصة</label>
              <p className="text-sm text-white">FrameID</p>
            </div>
            <div>
              <label className="text-xs text-white/40">البريد الرسمي</label>
              <p className="text-sm text-white">admin@frameid.app</p>
            </div>
            <div>
              <label className="text-xs text-white/40">العملة الافتراضية</label>
              <p className="text-sm text-white">جنيه مصري (EGP)</p>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">العلامة التجارية</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40">الشعار</label>
              <p className="text-sm text-white/50">—</p>
            </div>
            <div>
              <label className="text-xs text-white/40">اللون الأساسي</label>
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-full bg-champagne" />
                <span className="text-sm text-white">Champagne #d8b46a</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5">
          <h3 className="mb-4 text-sm font-medium text-white/60">الفريق</h3>
          <p className="text-sm text-white/50">
            إدارة فريق الإدارة العليا والصلاحيات.
          </p>
          <a
            href="/admin/settings/team"
            className="mt-3 inline-flex text-sm text-champagne underline-offset-4 hover:underline"
          >
            إدارة الفريق
          </a>
        </div>
      </div>
    </CenterPageShell>
  );
}
