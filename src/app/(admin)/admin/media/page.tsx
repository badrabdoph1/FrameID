import {
  Activity,
  ArchiveRestore,
  Copy,
  DatabaseBackup,
  FileWarning,
  Image as ImageIcon,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { selectDuplicateCleanupCandidates, type MediaScanReport } from "@/modules/media/media-scan-report";
import { MediaTableClient } from "./media-table-client";
import {
  moveDuplicateMediaToTrashAction,
  moveUnusedMediaToTrashAction,
  purgeEligibleMediaAction,
  restoreTrashedMediaAction,
  startMediaScanOperationAction,
} from "./actions";

export const dynamic = "force-dynamic";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ar-EG")} ك.ب`
    : `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} م.ب`;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "لم يتم بعد";
  return value.toLocaleString("ar-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type MediaAssetRow = {
  id: string;
  url: string;
  storageKey: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  checksumSha256: string | null;
  createdAt: Date;
  tenant: { id: string; displayName: string } | null;
  _count?: {
    galleryImages: number;
    albumCovers: number;
    contactAvatars: number;
    contactCovers: number;
    seoOgImages: number;
    paymentProofs: number;
    paymentQRCodes: number;
    paymentSettingsQR: number;
  };
};

type OperationRow = {
  id: string;
  type: string;
  status: string;
  progress: number;
  processedItems: number;
  totalItems: number;
  createdAt: Date;
  finishedAt: Date | null;
  result: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scanReportFromOperation(operation: OperationRow | undefined): MediaScanReport | null {
  if (!operation || !isRecord(operation.result)) return null;
  const report = operation.result.report;
  if (!isRecord(report) || !isRecord(report.summary)) return null;
  if (!Array.isArray(report.unusedAssets) || !Array.isArray(report.duplicateGroups) || !Array.isArray(report.missingAssets)) {
    return null;
  }
  return report as MediaScanReport;
}

export default async function AdminMediaPage() {
  await requireAdminPermission("media", "view");

  let assets: MediaAssetRow[] = [];
  let templates: Array<{ id: string; name: string; previewData: unknown }> = [];
  let paymentSettings: Array<{ id: string; paymentMethod: string; qrCodeAssetId: string | null }> = [];
  let operations: OperationRow[] = [];
  let trashCount = 0;
  let eligiblePurgeCount = 0;

  if (process.env.DATABASE_URL) {
    try {
      [assets, templates, paymentSettings, operations, trashCount, eligiblePurgeCount] = await Promise.all([
        prisma.mediaAsset.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            url: true,
            storageKey: true,
            kind: true,
            mimeType: true,
            sizeBytes: true,
            width: true,
            height: true,
            alt: true,
            checksumSha256: true,
            createdAt: true,
            tenant: {
              select: { id: true, displayName: true },
            },
            _count: {
              select: {
                galleryImages: true,
                albumCovers: true,
                contactAvatars: true,
                contactCovers: true,
                seoOgImages: true,
                paymentProofs: true,
                paymentQRCodes: true,
                paymentSettingsQR: true,
              },
            },
          },
        }),
        prisma.template.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, previewData: true },
        }),
        prisma.paymentSettings.findMany({
          where: { qrCodeAssetId: { not: null } },
          select: { id: true, paymentMethod: true, qrCodeAssetId: true },
        }),
        prisma.operation.findMany({
          where: {
            type: {
              in: ["MEDIA_SCAN", "MEDIA_CLEANUP", "MEDIA_PURGE", "MEDIA_RESTORE", "MEDIA_RESYNC", "MEDIA_REPAIR"],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            type: true,
            status: true,
            progress: true,
            processedItems: true,
            totalItems: true,
            createdAt: true,
            finishedAt: true,
            result: true,
          },
        }),
        prisma.mediaCatalogEntry.count({
          where: { lifecycleStatus: "IN_TRASH" },
        }),
        prisma.mediaCatalogEntry.count({
          where: {
            lifecycleStatus: "IN_TRASH",
            purgeEligibleAt: { lte: new Date() },
          },
        }),
      ]);
    } catch {
      // Database unavailable
    }
  }

  const templateCoverUrls = new Set<string>();
  const templatePreviewUrls = new Set<string>();
  for (const t of templates) {
    const pd = t.previewData as Record<string, unknown> | null;
    if (pd) {
      if (typeof pd.previewImage === "string") templateCoverUrls.add(pd.previewImage);
      if (typeof pd.coverImage === "string") templateCoverUrls.add(pd.coverImage);
      if (typeof pd.image === "string") templatePreviewUrls.add(pd.image);
    }
  }

  const qrCodeAssetIds = new Set(paymentSettings.map((ps) => ps.qrCodeAssetId));
  const checksumCounts = new Map<string, number>();

  for (const asset of assets) {
    if (!asset.checksumSha256) continue;
    checksumCounts.set(asset.checksumSha256, (checksumCounts.get(asset.checksumSha256) ?? 0) + 1);
  }

  const rows = assets.map((asset) => {
    const usages: string[] = [];
    const relationCounts = asset._count
      ? [
          ["معرض", asset._count.galleryImages],
          ["غلاف ألبوم", asset._count.albumCovers],
          ["صورة بروفايل", asset._count.contactAvatars],
          ["غلاف موقع", asset._count.contactCovers],
          ["SEO", asset._count.seoOgImages],
          ["إثبات دفع", asset._count.paymentProofs],
          ["QR دفع", asset._count.paymentQRCodes + asset._count.paymentSettingsQR],
        ] as const
      : [];

    for (const [label, count] of relationCounts) {
      if (count > 0) usages.push(`${label}: ${count.toLocaleString("ar-EG")}`);
    }
    if (templateCoverUrls.has(asset.url)) usages.push("غلاف قالب");
    if (templatePreviewUrls.has(asset.url)) usages.push("معاينة قالب");
    if (qrCodeAssetIds.has(asset.id)) usages.push("QR Code دفع");
    if (asset.kind === "template-cover") usages.push("صورة قالب");

    return {
      id: asset.id,
      url: asset.url,
      storageKey: asset.storageKey,
      fileName: asset.storageKey.split("/").at(-1) ?? "",
      path: asset.storageKey,
      alt: asset.alt,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      sizeLabel: formatSize(asset.sizeBytes),
      dimensions:
        asset.width && asset.height ? `${asset.width}×${asset.height}` : null,
      kind: asset.kind,
      tenantName: asset.tenant?.displayName ?? "—",
      usages: usages.length > 0 ? usages.join("، ") : "غير مستخدم",
      createdAt: asset.createdAt.toISOString(),
    };
  });

  const totalCount = assets.length;
  const totalSize = assets.reduce((acc, a) => acc + a.sizeBytes, 0);
  const usedCount = rows.filter((row) => row.usages !== "غير مستخدم").length;
  const unusedCount = Math.max(0, totalCount - usedCount);
  const duplicateCount = assets.filter(
    (asset) => asset.checksumSha256 && (checksumCounts.get(asset.checksumSha256) ?? 0) > 1,
  ).length;
  const githubCount = assets.filter((asset) => asset.url.includes("raw.githubusercontent.com")).length;
  const lastScan = operations.find((operation) => operation.type === "MEDIA_SCAN");
  const lastCleanup = operations.find((operation) => operation.type === "MEDIA_CLEANUP" || operation.type === "MEDIA_PURGE");
  const runningOperations = operations.filter((operation) =>
    ["PENDING", "RUNNING", "PAUSE_REQUESTED", "CANCEL_REQUESTED"].includes(operation.status),
  );
  const completedOperations = operations.filter((operation) =>
    ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"].includes(operation.status),
  );
  const lastScanReport = scanReportFromOperation(lastScan);
  const reportSummary = lastScanReport?.summary;
  const duplicateCleanupCount = lastScanReport ? selectDuplicateCleanupCandidates(lastScanReport).length : 0;
  const missingLocalAssetsLabel = reportSummary ? reportSummary.missingLocalAssets.toLocaleString("ar-EG") : "—";

  return (
    <AdminPageShell
      badge="المحتوى"
      title="إدارة الوسائط"
      description="مركز إدارة وصيانة ومراقبة الوسائط: فحص، تنظيف آمن، سلة محذوفات، تكرارات، سلامة بيانات، وعمليات طويلة التنفيذ."
      breadcrumbs={[
        { label: "المحتوى", href: "/admin/content" },
        { label: "إدارة الوسائط" },
      ]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="إجمالي الصور" value={totalCount.toLocaleString("ar-EG")} hint={formatSize(totalSize)} />
        <MetricCard label="الصور المستخدمة" value={usedCount.toLocaleString("ar-EG")} hint="مرتبطة بعناصر حالية" />
        <MetricCard label="الصور غير المستخدمة" value={unusedCount.toLocaleString("ar-EG")} hint="مرشحة للمراجعة فقط" />
        <MetricCard label="الصور المكررة" value={duplicateCount.toLocaleString("ar-EG")} hint="حسب Hash المتاح" />
        <MetricCard label="GitHub" value={githubCount.toLocaleString("ar-EG")} hint="Provider حالي" />
        <MetricCard label="الصور التالفة" value="—" hint="تحتاج فحص ملفات عميق" muted />
        <MetricCard label="الصور المفقودة" value={missingLocalAssetsLabel} hint="من آخر فحص" muted={!reportSummary} />
        <MetricCard label="النسخ الاحتياطية" value="—" hint="من manifests الفحص" muted />
        <MetricCard label="في سلة الوسائط" value={trashCount.toLocaleString("ar-EG")} hint="حذف منطقي فقط" />
        <MetricCard label="آخر فحص" value={formatDate(lastScan?.finishedAt ?? lastScan?.createdAt)} hint={lastScan?.status ?? "لا توجد عملية"} wide />
        <MetricCard label="آخر تنظيف" value={formatDate(lastCleanup?.finishedAt ?? lastCleanup?.createdAt)} hint={lastCleanup?.status ?? "لم يحدث تنظيف"} wide />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-[#fff7e8]">فحص الوسائط</h2>
              <p className="mt-1 max-w-2xl text-xs font-bold leading-6 text-white/42">
                يسجل عملية دائمة ويحلل الجرد الحالي بدون حذف. نتائج الفحص تظهر في سجل العمليات وتفتح الطريق للتنظيف الآمن.
              </p>
            </div>
            <form action={startMediaScanOperationAction}>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/14 px-4 text-xs font-black text-amber-100 transition hover:bg-amber-300/20" type="submit">
                <Play className="size-4" />
                بدء فحص الوسائط
              </button>
            </form>
          </div>

          {lastScanReport ? (
            <section className="mt-4 rounded-2xl border border-amber-300/18 bg-amber-300/[0.055] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-amber-100">تقرير آخر فحص</h3>
                  <p className="mt-1 text-xs font-bold leading-6 text-white/45">
                    وجد الفحص {lastScanReport.summary.unusedAssets.toLocaleString("ar-EG")} غير مستخدم،
                    {" "}{lastScanReport.summary.duplicateAssets.toLocaleString("ar-EG")} مكرر،
                    و {lastScanReport.summary.missingLocalAssets.toLocaleString("ar-EG")} مفقود محليًا.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={moveUnusedMediaToTrashAction}>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/12 bg-black/24 px-4 text-xs font-black text-white/72 transition hover:border-amber-300/35 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={lastScanReport.summary.unusedAssets === 0}
                      type="submit"
                    >
                      <Trash2 className="size-4" />
                      نقل غير المستخدم للسلة
                    </button>
                  </form>
                  <form action={moveDuplicateMediaToTrashAction}>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/12 bg-black/24 px-4 text-xs font-black text-white/72 transition hover:border-amber-300/35 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={duplicateCleanupCount === 0}
                      type="submit"
                    >
                      <Copy className="size-4" />
                      تنظيف المكرر غير المستخدم
                    </button>
                  </form>
                  <form action={restoreTrashedMediaAction}>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/12 bg-black/24 px-4 text-xs font-black text-white/72 transition hover:border-amber-300/35 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={trashCount === 0}
                      type="submit"
                    >
                      <ArchiveRestore className="size-4" />
                      استعادة عناصر السلة
                    </button>
                  </form>
                  <form action={purgeEligibleMediaAction}>
                    <button
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-4 text-xs font-black text-red-100/80 transition hover:border-red-300/40 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={eligiblePurgeCount === 0}
                      type="submit"
                    >
                      <Trash2 className="size-4" />
                      حذف نهائي للمؤهل
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <ReportList title="غير مستخدمة في آخر فحص" items={lastScanReport.unusedAssets.map((asset) => `${asset.fileName} · ${formatSize(asset.sizeBytes)}`)} />
                <ReportList title="مجموعات التكرار" items={lastScanReport.duplicateGroups.map((group) => `${group.count.toLocaleString("ar-EG")} عناصر · وفر ${formatSize(group.reclaimableBytes)}`)} />
                <ReportList title="ملفات مفقودة" items={lastScanReport.missingAssets.map((asset) => asset.fileName)} />
              </div>
            </section>
          ) : (
            <section className="mt-4 rounded-2xl border border-white/8 bg-black/14 p-4">
              <h3 className="text-sm font-black text-[#fff7e8]">لا يوجد تقرير فحص بعد</h3>
              <p className="mt-1 text-xs font-bold leading-6 text-white/40">
                اضغط “بدء فحص الوسائط” ليظهر هنا تقرير فعلي قابل للتصرف بدل الأرقام العامة.
              </p>
            </section>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <ManagementTile icon={Sparkles} title="التنظيف الذكي" text="ينقل غير المستخدم إلى السلة بعد فحص المراجع." status="محمي" />
            <ManagementTile icon={Trash2} title="سلة الوسائط" text="احتفاظ افتراضي 30 يومًا، استعادة، وحذف نهائي بتأكيد." status={`${trashCount.toLocaleString("ar-EG")} عنصر`} />
            <ManagementTile icon={FileWarning} title="مؤهل للحذف النهائي" text="لا يُحذف إلا بزر صريح وبعد إعادة فحص الاستخدام." status={`${eligiblePurgeCount.toLocaleString("ar-EG")} عنصر`} />
            <ManagementTile icon={Copy} title="التكرارات" text="تجميع حسب Hash مع تقدير المساحة قبل أي دمج." status={`${(reportSummary?.duplicateAssets ?? duplicateCount).toLocaleString("ar-EG")} عنصر`} />
            <ManagementTile icon={ShieldCheck} title="سلامة البيانات" text="مقارنة DB و uploads و Provider والنسخ الاحتياطية." status={reportSummary ? "لديه تقرير" : "يتطلب فحص"} />
            <ManagementTile icon={ArchiveRestore} title="الاستعادة" text="إرجاع الوسائط من السلة قبل أي حذف نهائي." status="ضمن دورة الحياة" />
            <ManagementTile icon={DatabaseBackup} title="النسخ الاحتياطية" text="تظهر الفروقات كتنبيهات لا كحذف تلقائي." status="بدون تغيير السلوك" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-amber-300" />
            <h2 className="text-base font-black text-[#fff7e8]">العمليات الطويلة</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <MetricCard label="عمليات جارية" value={runningOperations.length.toLocaleString("ar-EG")} hint="Persistent Operations" compact />
            <MetricCard label="عمليات منتهية" value={completedOperations.length.toLocaleString("ar-EG")} hint="آخر 6 عمليات وسائط" compact />
            <div className="rounded-xl border border-white/8 bg-black/14 p-3">
              <p className="text-xs font-black text-white/45">آخر عملية</p>
              <p className="mt-1 text-sm font-black text-[#fff7e8]">
                {operations[0] ? `${operationLabel(operations[0].type)} · ${operations[0].status}` : "لا توجد عمليات مسجلة"}
              </p>
              <p className="mt-1 text-xs font-bold text-white/35">
                {operations[0]
                  ? `${operations[0].processedItems.toLocaleString("ar-EG")} / ${operations[0].totalItems.toLocaleString("ar-EG")}`
                  : "ابدأ فحص الوسائط لإنشاء أول سجل."}
              </p>
            </div>
            <a href="/admin/operations" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 text-xs font-black text-white/62 no-underline transition hover:border-amber-300/24 hover:text-amber-100">
              <RefreshCw className="size-4" />
              فتح مركز العمليات
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#fff7e8]">الجرد الحالي</h2>
            <p className="mt-1 text-xs font-bold text-white/38">
              هذا الجدول يعرض الوسائط الحالية، بينما قرارات الحذف والتنظيف تعتمد على الفحص وسجل العمليات.
            </p>
          </div>
          <FileWarning className="hidden size-5 text-white/24 sm:block" />
        </div>

      {rows.length === 0 ? (
        <AdminEmptyState
          title="لا توجد وسائط مرفوعة"
          description="ستظهر الصور والملفات هنا بعد رفعها من موقع العميل أو محرر القالب."
          icon={ImageIcon}
        />
      ) : (
        <MediaTableClient rows={rows} />
      )}
      </section>
    </AdminPageShell>
  );
}

function ReportList({ title, items }: { title: string; items: string[] }) {
  const visible = items.slice(0, 4);
  return (
    <div className="rounded-xl border border-white/8 bg-black/18 p-3">
      <h4 className="text-xs font-black text-white/58">{title}</h4>
      {visible.length === 0 ? (
        <p className="mt-3 text-xs font-bold text-white/32">لا توجد عناصر في هذا القسم.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {visible.map((item) => (
            <li key={item} className="truncate text-xs font-bold text-white/45">{item}</li>
          ))}
        </ul>
      )}
      {items.length > visible.length ? (
        <p className="mt-2 text-[0.68rem] font-black text-amber-200/70">
          +{(items.length - visible.length).toLocaleString("ar-EG")} عناصر أخرى
        </p>
      ) : null}
    </div>
  );
}

function operationLabel(type: string) {
  const labels: Record<string, string> = {
    MEDIA_SCAN: "فحص الوسائط",
    MEDIA_CLEANUP: "تنظيف الوسائط",
    MEDIA_PURGE: "حذف نهائي",
    MEDIA_RESTORE: "استعادة",
    MEDIA_RESYNC: "إعادة مزامنة",
    MEDIA_REPAIR: "إصلاح",
  };
  return labels[type] ?? type;
}

function MetricCard({
  label,
  value,
  hint,
  muted,
  wide,
  compact,
}: {
  label: string;
  value: string;
  hint: string;
  muted?: boolean;
  wide?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.035] ${compact ? "p-3" : "p-4"} ${wide ? "xl:col-span-2" : ""}`}>
      <p className="text-xs font-black text-white/42">{label}</p>
      <p className={`mt-1 truncate ${compact ? "text-xl" : "text-2xl"} font-black ${muted ? "text-white/42" : "text-[#fff7e8]"}`}>
        {value}
      </p>
      <p className="mt-1 truncate text-[0.68rem] font-bold text-white/30">{hint}</p>
    </div>
  );
}

function ManagementTile({
  icon: Icon,
  title,
  text,
  status,
}: {
  icon: typeof Sparkles;
  title: string;
  text: string;
  status: string;
}) {
  return (
    <article className="rounded-xl border border-white/8 bg-black/14 p-3">
      <div className="flex items-center justify-between gap-3">
        <Icon className="size-4 text-amber-300" />
        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-[0.62rem] font-black text-white/42">
          {status}
        </span>
      </div>
      <h3 className="mt-3 text-sm font-black text-[#fff7e8]">{title}</h3>
      <p className="mt-1 text-xs font-bold leading-5 text-white/38">{text}</p>
    </article>
  );
}
