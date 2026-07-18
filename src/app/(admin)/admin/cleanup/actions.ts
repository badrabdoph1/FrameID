"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { computePurgeEligibleAt } from "@/modules/media/media-lifecycle";

type AdminActor = Awaited<ReturnType<typeof requireAdminPermission>>;

function providerIdForAsset(url: string) {
  return url.includes("raw.githubusercontent.com") ? "github-current" : "local-public";
}

function totalReferenceCount(counts: {
  galleryImages: number;
  albumCovers: number;
  contactAvatars: number;
  contactCovers: number;
  seoOgImages: number;
  paymentProofs: number;
  paymentQRCodes: number;
  paymentSettingsQR: number;
}) {
  return (
    counts.galleryImages +
    counts.albumCovers +
    counts.contactAvatars +
    counts.contactCovers +
    counts.seoOgImages +
    counts.paymentProofs +
    counts.paymentQRCodes +
    counts.paymentSettingsQR
  );
}

export async function moveExpiredTenantAssetsToTrashAction(formData: FormData) {
  const admin = await requireAdminPermission("cleanup", "edit");

  const tenantIdsRaw = formData.get("tenantIds");
  const tenantIds: string[] =
    typeof tenantIdsRaw === "string" && tenantIdsRaw
      ? JSON.parse(tenantIdsRaw)
      : [];

  if (tenantIds.length === 0) {
    return { success: false, error: "لم يتم تحديد أي حساب." };
  }

  const startedAt = new Date();

  const settings = await prisma.mediaSettings.upsert({
    where: { key: "default" },
    update: {},
    create: { key: "default" },
  });

  const assets = await prisma.mediaAsset.findMany({
    where: {
      tenantId: { in: tenantIds },
      deletedAt: null,
    },
    select: {
      id: true,
      url: true,
      storageKey: true,
      kind: true,
      mimeType: true,
      sizeBytes: true,
      width: true,
      height: true,
      checksumSha256: true,
      tenantId: true,
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

  const unusedAssets = assets.filter(
    (asset) => totalReferenceCount(asset._count) === 0,
  );

  if (unusedAssets.length === 0) {
    return {
      success: true,
      moved: 0,
      skipped: assets.length,
      message: "جميع الوسائط مستخدمة حاليًا ولا يمكن نقلها للسلة.",
    };
  }

  const reclaimableBytes = unusedAssets.reduce(
    (sum, a) => sum + a.sizeBytes,
    0,
  );

  const finishedAt = new Date();
  const operation = await prisma.operation.create({
    data: {
      type: "MEDIA_CLEANUP",
      status: "SUCCEEDED",
      title: "تنظيف بقايا حسابات منتهية",
      progress: 1,
      totalItems: unusedAssets.length,
      processedItems: unusedAssets.length,
      startedAt,
      finishedAt,
      lastHeartbeatAt: finishedAt,
      requestedByAdminId: admin.id,
      requestedByName: admin.name,
      cancellable: false,
      resumable: true,
      input: {
        mode: "cleanup-expired-tenants",
        source: "admin-cleanup-page",
        tenantIds,
      },
      result: {
        movedToTrash: unusedAssets.length,
        skippedBecauseUsed: assets.length - unusedAssets.length,
        reclaimableBytes,
        note: "تم نقل الوسائط غير المستخدمة من الحسابات المنتهية إلى سلة الوسائط. لم يتم حذف أي ملف من التخزين.",
      },
    },
  });

  const trashedAt = new Date();
  const purgeEligibleAt = computePurgeEligibleAt({
    trashedAt,
    retentionDays: settings.trashRetentionDays,
  });

  for (const asset of unusedAssets) {
    const catalog = await prisma.mediaCatalogEntry.upsert({
      where: {
        sourceKind_sourceId: {
          sourceKind: "CUSTOMER_MEDIA",
          sourceId: asset.id,
        },
      },
      create: {
        sourceKind: "CUSTOMER_MEDIA",
        sourceId: asset.id,
        tenantId: asset.tenantId,
        providerId: providerIdForAsset(asset.url),
        storageKey: asset.storageKey,
        url: asset.url,
        kind: asset.kind,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        width: asset.width,
        height: asset.height,
        checksumSha256: asset.checksumSha256,
        lifecycleStatus: "IN_TRASH",
        usageStatus: "UNUSED",
        trashedAt,
        purgeEligibleAt,
        trashReason: "بقايا وسائط من حساب منتهي — تنظيف عبر نظام التنظيف",
        trashActorId: admin.id,
        trashOperationId: operation.id,
      },
      update: {
        lifecycleStatus: "IN_TRASH",
        usageStatus: "UNUSED",
        trashedAt,
        purgeEligibleAt,
        trashReason: "بقايا وسائط من حساب منتهي — تنظيف عبر نظام التنظيف",
        trashActorId: admin.id,
        trashOperationId: operation.id,
        lastVerifiedAt: trashedAt,
      },
    });

    await prisma.mediaLifecycleEvent.create({
      data: {
        mediaId: catalog.id,
        operationId: operation.id,
        actorAdminId: admin.id,
        toLifecycleStatus: "IN_TRASH",
        toUsageStatus: "UNUSED",
        reason: "نقل من حساب منتهي عبر نظام التنظيف",
        metadata: {
          storageKey: asset.storageKey,
          sizeBytes: asset.sizeBytes,
          tenantId: asset.tenantId,
        },
      },
    });
  }

  await prisma.operationEvent.create({
    data: {
      operationId: operation.id,
      level: "INFO",
      code: "CLEANUP_EXPIRED_TENANT_ASSETS",
      message: `تم نقل ${unusedAssets.length} وسيط غير مستخدم من ${tenantIds.length} حساب منتهي إلى السلة.`,
      data: {
        movedToTrash: unusedAssets.length,
        skippedBecauseUsed: assets.length - unusedAssets.length,
        tenantCount: tenantIds.length,
        reclaimableBytes,
      },
    },
  });

  revalidatePath("/admin/cleanup");
  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");

  return {
    success: true,
    moved: unusedAssets.length,
    skipped: assets.length - unusedAssets.length,
    message: `تم نقل ${unusedAssets.length.toLocaleString("ar-EG")} وسيط إلى السلة. ${assets.length - unusedAssets.length > 0 ? `تم تخطي ${(assets.length - unusedAssets.length).toLocaleString("ar-EG")} لأنها مستخدمة.` : ""}`,
  };
}

export async function moveAllExpiredAssetsToTrashAction() {
  const admin = await requireAdminPermission("cleanup", "edit");

  const expiredStatuses = ["EXPIRED", "TRIAL_EXPIRED", "SUSPENDED"];
  const startedAt = new Date();

  const tenants = await prisma.tenant.findMany({
    where: {
      deletedAt: null,
      status: { in: expiredStatuses },
      mediaAssets: { some: { deletedAt: null } },
    },
    select: { id: true },
  });

  if (tenants.length === 0) {
    return {
      success: true,
      moved: 0,
      skipped: 0,
      message: "لا توجد حسابات منتهية بها وسائط حاليًا.",
    };
  }

  const settings = await prisma.mediaSettings.upsert({
    where: { key: "default" },
    update: {},
    create: { key: "default" },
  });

  const tenantIds = tenants.map((t) => t.id);

  const assets = await prisma.mediaAsset.findMany({
    where: {
      tenantId: { in: tenantIds },
      deletedAt: null,
    },
    select: {
      id: true,
      url: true,
      storageKey: true,
      kind: true,
      mimeType: true,
      sizeBytes: true,
      width: true,
      height: true,
      checksumSha256: true,
      tenantId: true,
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

  const unusedAssets = assets.filter(
    (asset) => totalReferenceCount(asset._count) === 0,
  );

  if (unusedAssets.length === 0) {
    return {
      success: true,
      moved: 0,
      skipped: assets.length,
      message: "جميع الوسائط في الحسابات المنتهية مستخدمة حاليًا.",
    };
  }

  const reclaimableBytes = unusedAssets.reduce(
    (sum, a) => sum + a.sizeBytes,
    0,
  );

  const finishedAt = new Date();
  const operation = await prisma.operation.create({
    data: {
      type: "MEDIA_CLEANUP",
      status: "SUCCEEDED",
      title: "تنظيف شامل لبقايا الحسابات المنتهية",
      progress: 1,
      totalItems: unusedAssets.length,
      processedItems: unusedAssets.length,
      startedAt,
      finishedAt,
      lastHeartbeatAt: finishedAt,
      requestedByAdminId: admin.id,
      requestedByName: admin.name,
      cancellable: false,
      resumable: true,
      input: {
        mode: "cleanup-all-expired-tenants",
        source: "admin-cleanup-page",
        tenantIds,
      },
      result: {
        movedToTrash: unusedAssets.length,
        skippedBecauseUsed: assets.length - unusedAssets.length,
        reclaimableBytes,
        note: "تم نقل جميع الوسائط غير المستخدمة من جميع الحسابات المنتهية إلى سلة الوسائط.",
      },
    },
  });

  const trashedAt = new Date();
  const purgeEligibleAt = computePurgeEligibleAt({
    trashedAt,
    retentionDays: settings.trashRetentionDays,
  });

  for (const asset of unusedAssets) {
    const catalog = await prisma.mediaCatalogEntry.upsert({
      where: {
        sourceKind_sourceId: {
          sourceKind: "CUSTOMER_MEDIA",
          sourceId: asset.id,
        },
      },
      create: {
        sourceKind: "CUSTOMER_MEDIA",
        sourceId: asset.id,
        tenantId: asset.tenantId,
        providerId: providerIdForAsset(asset.url),
        storageKey: asset.storageKey,
        url: asset.url,
        kind: asset.kind,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        width: asset.width,
        height: asset.height,
        checksumSha256: asset.checksumSha256,
        lifecycleStatus: "IN_TRASH",
        usageStatus: "UNUSED",
        trashedAt,
        purgeEligibleAt,
        trashReason: "تنظيف شامل لبقايا الحسابات المنتهية",
        trashActorId: admin.id,
        trashOperationId: operation.id,
      },
      update: {
        lifecycleStatus: "IN_TRASH",
        usageStatus: "UNUSED",
        trashedAt,
        purgeEligibleAt,
        trashReason: "تنظيف شامل لبقايا الحسابات المنتهية",
        trashActorId: admin.id,
        trashOperationId: operation.id,
        lastVerifiedAt: trashedAt,
      },
    });

    await prisma.mediaLifecycleEvent.create({
      data: {
        mediaId: catalog.id,
        operationId: operation.id,
        actorAdminId: admin.id,
        toLifecycleStatus: "IN_TRASH",
        toUsageStatus: "UNUSED",
        reason: "تنظيف شامل لبقايا الحسابات المنتهية عبر نظام التنظيف",
        metadata: {
          storageKey: asset.storageKey,
          sizeBytes: asset.sizeBytes,
          tenantId: asset.tenantId,
        },
      },
    });
  }

  await prisma.operationEvent.create({
    data: {
      operationId: operation.id,
      level: "INFO",
      code: "CLEANUP_ALL_EXPIRED_TENANT_ASSETS",
      message: `تم نقل ${unusedAssets.length} وسيط من ${tenantIds.length} حساب منتهي إلى السلة.`,
      data: {
        movedToTrash: unusedAssets.length,
        skippedBecauseUsed: assets.length - unusedAssets.length,
        tenantCount: tenantIds.length,
        reclaimableBytes,
      },
    },
  });

  revalidatePath("/admin/cleanup");
  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");

  return {
    success: true,
    moved: unusedAssets.length,
    skipped: assets.length - unusedAssets.length,
    message: `تم نقل ${unusedAssets.length.toLocaleString("ar-EG")} وسيط غير مستخدم إلى السلة من ${tenantIds.length.toLocaleString("ar-EG")} حساب منتهي.`,
  };
}
