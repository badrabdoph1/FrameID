import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";

export const dynamic = "force-dynamic";

type RenderingMetadata = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  return String(value);
}

const fields: Array<[keyof RenderingMetadata, string]> = [
  ["deviceId", "معرّف الجهاز"],
  ["manufacturer", "الشركة المصنعة"],
  ["model", "الموديل"],
  ["platform", "المنصة"],
  ["platformVersion", "إصدار المنصة"],
  ["androidVersion", "إصدار Android"],
  ["browserName", "المتصفح"],
  ["browserVersion", "إصدار المتصفح"],
  ["webViewVersion", "إصدار WebView"],
  ["pwaInstalled", "تطبيق الويب مثبت"],
  ["safeRenderingEnabled", "العرض الآمن"],
  ["safeRenderingReason", "سبب التفعيل"],
  ["backdropFilterSupported", "تمويه الخلفية مدعوم"],
  ["backdropFilterInUse", "تمويه الخلفية مستخدم"],
  ["backdropFilterLayerCount", "عدد طبقات التمويه"],
  ["devicePixelRatio", "كثافة بكسلات الجهاز"],
  ["screenWidth", "عرض الشاشة"],
  ["screenHeight", "ارتفاع الشاشة"],
  ["viewportWidth", "عرض نافذة العرض"],
  ["viewportHeight", "ارتفاع نافذة العرض"],
  ["hardwareConcurrency", "أنوية المعالج المتاحة"],
  ["deviceMemory", "ذاكرة الجهاز التقريبية"],
  ["gpuVendor", "مصنّع معالج الرسوم"],
  ["gpuRenderer", "معالج الرسوم"],
  ["route", "المسار"],
  ["userAgent", "هوية المتصفح التقنية"],
];

export default async function RenderingDiagnosticsPage() {
  await requireSuperAdminSession();

  const logs = await prisma.errorLog.findMany({
    where: { category: { in: ["CLIENT_RENDERING", "CLIENT_ERROR"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminPageShell badge="النظام" title="تشخيصات العرض والأجهزة" description="بيانات تقنية تُجمع فقط عند بلاغ عرض أو خطأ فعلي.">
      {logs.length === 0 ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm font-bold text-white/45">
          لا توجد بلاغات عرض أو أخطاء متصفح مسجلة حتى الآن.
        </section>
      ) : (
        <div className="grid gap-4">
          {logs.map((log) => {
            const metadata = asRecord(log.metadata);
            const rendering = asRecord(metadata?.rendering);
            return (
              <article key={log.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-300/12 px-2.5 py-1 text-xs font-black text-amber-200">{log.category}</span>
                      <span className="rounded-full bg-white/7 px-2.5 py-1 font-mono text-xs text-white/55">{log.code ?? "—"}</span>
                    </div>
                    <h2 className="mt-3 text-base font-black text-white">{log.message}</h2>
                    <p className="mt-1 text-xs font-bold text-white/35">{new Date(log.createdAt).toLocaleString("ar-EG")}</p>
                  </div>
                  <span className={log.resolved ? "text-xs font-black text-emerald-300" : "text-xs font-black text-amber-300"}>
                    {log.resolved ? "تم الحل" : "مفتوح"}
                  </span>
                </div>

                <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {fields.map(([key, label]) => (
                    <div key={String(key)} className="min-w-0 rounded-2xl border border-white/8 bg-black/15 p-3">
                      <dt className="text-[0.68rem] font-black text-white/35">{label}</dt>
                      <dd className="mt-1 break-words text-xs font-bold leading-5 text-white/75">{display(rendering?.[key])}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
