import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

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
  ["pwaInstalled", "PWA مثبت"],
  ["safeRenderingEnabled", "Safe Rendering"],
  ["safeRenderingReason", "سبب التفعيل"],
  ["backdropFilterSupported", "Backdrop Filter مدعوم"],
  ["backdropFilterInUse", "Backdrop Filter مستخدم"],
  ["backdropFilterLayerCount", "عدد طبقات Backdrop"],
  ["devicePixelRatio", "Device Pixel Ratio"],
  ["screenWidth", "عرض الشاشة"],
  ["screenHeight", "ارتفاع الشاشة"],
  ["viewportWidth", "عرض Viewport"],
  ["viewportHeight", "ارتفاع Viewport"],
  ["hardwareConcurrency", "أنوية المعالج المتاحة"],
  ["deviceMemory", "ذاكرة الجهاز التقريبية"],
  ["gpuVendor", "GPU Vendor"],
  ["gpuRenderer", "GPU Renderer"],
  ["route", "المسار"],
  ["userAgent", "User Agent"],
];

export default async function RenderingDiagnosticsPage() {
  await requireSuperAdminSession();

  const logs = await prisma.errorLog.findMany({
    where: { category: { in: ["CLIENT_RENDERING", "CLIENT_ERROR"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-black text-amber-300">ADMIN ONLY</p>
        <h1 className="mt-1 text-2xl font-black text-white">تشخيصات Rendering والأجهزة</h1>
        <p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-white/45">
          بيانات تقنية تُجمع فقط عند بلاغ Rendering أو خطأ فعلي، وتُستخدم لمقارنة الجهاز والمتصفح وWebView وGPU بدون تغيير التصميم لبقية العملاء.
        </p>
      </header>

      {logs.length === 0 ? (
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm font-bold text-white/45">
          لا توجد بلاغات Rendering أو Client Errors مسجلة حتى الآن.
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
    </main>
  );
}
