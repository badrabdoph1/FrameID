import {
  AlertTriangle,
  Clock,
  DatabaseZap,
  Image as ImageIcon,
  ScanSearch,
  Trash2,
  Users,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import type { TenantStatus } from "@prisma/client";
import { CleanupFiltersClient } from "./cleanup-filters-client";

export const dynamic = "force-dynamic";

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ar-EG")} ك.ب`
    : `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} م.ب`;
}

type CleanupTenantRow = {
  id: string;
  displayName: string;
  status: string;
  trialEndsAt: Date | null;
  gracePeriodEndsAt: Date | null;
  createdAt: Date;
  owner: { email: string; name: string | null } | null;
  subscriptions: {
    status: string;
    expiresAt: Date | null;
    cancelledAt: Date | null;
  }[] | [];
  _count: { mediaAssets: number };
  totalSizeBytes: number;
};

type OrphanedAssetRow = {
  id: string;
  storageKey: string;
  url: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  tenant: { id: string; displayName: string; status: string } | null;
  _count: {
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

export default async function AdminCleanupPage() {
  await requireAdminPermission("cleanup", "view");

  let tenantsWithMedia: CleanupTenantRow[] = [];
  let orphanedAssets: OrphanedAssetRow[] = [];
  let totalOrphanedSize = 0;
  let expiredTenantCount = 0;
  let totalOrphanedCount = 0;

  if (process.env.DATABASE_URL) {
    try {
      const expiredStatuses: TenantStatus[] = ["EXPIRED", "TRIAL_EXPIRED", "SUSPENDED"];

      const rawTenants = await prisma.tenant.findMany({
        where: {
          deletedAt: null,
          status: { in: expiredStatuses },
          mediaAssets: { some: { deletedAt: null } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          displayName: true,
          status: true,
          trialEndsAt: true,
          gracePeriodEndsAt: true,
          createdAt: true,
          owner: {
            select: { email: true, name: true },
          },
          subscriptions: {
            select: {
              status: true,
              expiresAt: true,
              cancelledAt: true,
            },
            take: 1,
          },
          _count: {
            select: { mediaAssets: true },
          },
        },
      });
      tenantsWithMedia = rawTenants as unknown as CleanupTenantRow[];

      const tenantIds = tenantsWithMedia.map((t) => t.id);

      if (tenantIds.length > 0) {
        const assets = await prisma.mediaAsset.findMany({
          where: {
            tenantId: { in: tenantIds },
            deletedAt: null,
          },
          orderBy: { createdAt: "asc" },
          take: 500,
          select: {
            id: true,
            storageKey: true,
            url: true,
            kind: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
            tenant: {
              select: { id: true, displayName: true, status: true },
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
        });

        orphanedAssets = assets;
        totalOrphanedSize = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
        totalOrphanedCount = assets.length;
      }

      expiredTenantCount = tenantsWithMedia.length;

      for (const tenant of tenantsWithMedia) {
        const tenantAssets = await prisma.mediaAsset.aggregate({
          where: { tenantId: tenant.id, deletedAt: null },
          _sum: { sizeBytes: true },
        });
        (tenant as CleanupTenantRow).totalSizeBytes = tenantAssets._sum.sizeBytes ?? 0;
      }
    } catch {
      // Database unavailable
    }
  }

  const assetsForClient = orphanedAssets.map((asset) => ({
    id: asset.id,
    storageKey: asset.storageKey,
    fileName: asset.storageKey.split("/").at(-1) ?? "",
    url: asset.url,
    kind: asset.kind,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    sizeLabel: formatSize(asset.sizeBytes),
    createdAt: asset.createdAt.toISOString(),
    tenantName: asset.tenant?.displayName ?? "—",
    tenantStatus: asset.tenant?.status ?? "—",
    hasReferences:
      asset._count.galleryImages +
        asset._count.albumCovers +
        asset._count.contactAvatars +
        asset._count.contactCovers +
        asset._count.seoOgImages +
        asset._count.paymentProofs +
        asset._count.paymentQRCodes +
        asset._count.paymentSettingsQR >
      0,
    referenceCount:
      asset._count.galleryImages +
      asset._count.albumCovers +
      asset._count.contactAvatars +
      asset._count.contactCovers +
      asset._count.seoOgImages +
      asset._count.paymentProofs +
      asset._count.paymentQRCodes +
      asset._count.paymentSettingsQR,
  }));

  const tenantsForClient = tenantsWithMedia.map((tenant) => ({
    id: tenant.id,
    displayName: tenant.displayName,
    status: tenant.status,
    ownerEmail: tenant.owner?.email ?? "—",
    ownerName: tenant.owner?.name ?? "—",
    subscriptionStatus: tenant.subscriptions[0]?.status ?? "بدون اشتراك",
    subscriptionExpiresAt: tenant.subscriptions[0]?.expiresAt?.toISOString() ?? null,
    cancelledAt: tenant.subscriptions[0]?.cancelledAt?.toISOString() ?? null,
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    gracePeriodEndsAt: tenant.gracePeriodEndsAt?.toISOString() ?? null,
    mediaCount: tenant._count.mediaAssets,
    totalSizeBytes: tenant.totalSizeBytes,
    totalSizeLabel: formatSize(tenant.totalSizeBytes),
  }));

  return (
    <AdminPageShell
      badge="النظام"
      title="نظام التنظيف"
      description="تحديد وتنظيف بقايا الوسائط والصور المرتبطة بالحسابات المنتهية أو غير النشطة. فلترة حسب حالة الحساب ونوع الوسيط وحالة الاشتراك."
      breadcrumbs={[
        { label: "النظام", href: "/admin/system" },
        { label: "نظام التنظيف" },
      ]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="حسابات منتهية بها وسائط"
          value={expiredTenantCount.toLocaleString("ar-EG")}
          hint="الحسابات المنتهية أو المعلقة"
        />
        <StatCard
          icon={ImageIcon}
          label="إجمالي الوسائط المتأثرة"
          value={totalOrphanedCount.toLocaleString("ar-EG")}
          hint="صور وملفات في حسابات منتهية"
        />
        <StatCard
          icon={DatabaseZap}
          label="حجم المساحة المحتملة"
          value={formatSize(totalOrphanedSize)}
          hint="المساحة القابلة للتحرير"
        />
        <StatCard
          icon={Clock}
          label="آخر فحص"
          value="مباشر"
          hint="البيانات تُحديث مع كل تحميل"
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center gap-2 mb-4">
          <ScanSearch className="size-4 text-amber-300" />
          <h2 className="text-base font-black text-[#fff7e8]">الحسابات المنتهية التي بها وسائط</h2>
        </div>

        {tenantsForClient.length === 0 ? (
          <div className="rounded-xl border border-white/8 bg-black/14 p-8 text-center">
            <Users className="mx-auto size-8 text-white/20" />
            <p className="mt-3 text-sm font-black text-white/45">
              لا توجد حسابات منتهية بها وسائط حاليًا
            </p>
            <p className="mt-1 text-xs font-bold text-white/30">
              جميع الحسابات النشطة لديها وسائط مرتبطة بشكل طبيعي.
            </p>
          </div>
        ) : (
          <CleanupFiltersClient
            tenants={tenantsForClient}
            assets={assetsForClient}
          />
        )}
      </section>
    </AdminPageShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-amber-300" />
        <p className="text-xs font-black text-white/42">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-black text-[#fff7e8]">{value}</p>
      <p className="mt-1 truncate text-[0.68rem] font-bold text-white/30">{hint}</p>
    </div>
  );
}
