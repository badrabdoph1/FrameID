import { Image as ImageIcon } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { MediaTableClient } from "./media-table-client";

export const dynamic = "force-dynamic";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ar-EG")} ك.ب`
    : `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} م.ب`;
}

export default async function AdminMediaPage() {
  await requireAdminPermission("media", "view");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let assets: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let templates: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let paymentSettings: any[] = [];

  if (process.env.DATABASE_URL) {
    try {
      [assets, templates, paymentSettings] = await Promise.all([
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
            createdAt: true,
            tenant: {
              select: { id: true, displayName: true },
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

  const rows = assets.map((asset) => {
    const usages: string[] = [];
    if (asset.tenant) usages.push(`عميل: ${asset.tenant.displayName}`);
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

  return (
    <AdminPageShell
      badge="المحتوى"
      title="مكتبة الوسائط"
      description="كل الصور والملفات في المنصة. اعرف مكان كل ملف واستخدمته، واستبدله عند الحاجة."
      breadcrumbs={[
        { label: "المحتوى", href: "/admin/content" },
        { label: "الوسائط" },
      ]}
    >
      <section className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black text-white/42">إجمالي الملفات</p>
          <p className="mt-1 text-2xl font-black text-[#fff7e8]">
            {totalCount.toLocaleString("ar-EG")}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black text-white/42">الحجم الإجمالي</p>
          <p className="mt-1 text-2xl font-black text-[#fff7e8]">
            {formatSize(totalSize)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black text-white/42">في القوالب</p>
          <p className="mt-1 text-2xl font-black text-[#fff7e8]">
            {templateCoverUrls.size.toLocaleString("ar-EG")}
          </p>
        </div>
      </section>

      {rows.length === 0 ? (
        <AdminEmptyState
          title="لا توجد وسائط مرفوعة"
          description="ستظهر الصور والملفات هنا بعد رفعها من موقع العميل أو محرر القالب."
          icon={ImageIcon}
        />
      ) : (
        <MediaTableClient rows={rows} />
      )}
    </AdminPageShell>
  );
}
