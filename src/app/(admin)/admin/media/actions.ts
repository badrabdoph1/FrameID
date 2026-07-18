"use server";

import { revalidatePath } from "next/cache";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { prisma } from "@/lib/prisma";
import { processImageFromFile } from "@/modules/media/image-processing-service";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { computePurgeEligibleAt } from "@/modules/media/media-lifecycle";
import {
  buildMediaScanReport,
  selectDuplicateCleanupCandidates,
  type MediaScanAssetInput,
  type MediaScanReport,
} from "@/modules/media/media-scan-report";

async function readString(formData: FormData, key: string): Promise<string> {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type MediaAssetForScan = {
  id: string;
  url: string;
  storageKey: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  checksumSha256: string | null;
  tenant: { displayName: string } | null;
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

function isLocalUrl(url: string) {
  return !url.startsWith("http");
}

async function storageKeyExists(storageKey: string) {
  try {
    await access(join(process.cwd(), "public", "uploads", storageKey));
    return true;
  } catch {
    return false;
  }
}

function assetReferences(asset: MediaAssetForScan): MediaScanAssetInput["references"] {
  const refs = [
    { label: "معرض", count: asset._count.galleryImages },
    { label: "غلاف ألبوم", count: asset._count.albumCovers },
    { label: "صورة بروفايل", count: asset._count.contactAvatars },
    { label: "غلاف موقع", count: asset._count.contactCovers },
    { label: "SEO", count: asset._count.seoOgImages },
    { label: "إثبات دفع", count: asset._count.paymentProofs },
    { label: "QR دفع", count: asset._count.paymentQRCodes + asset._count.paymentSettingsQR },
  ];
  return refs.filter((ref) => ref.count > 0);
}

function totalReferenceCount(counts: MediaAssetForScan["_count"]) {
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

async function collectMediaScanReport(now = new Date()): Promise<{
  report: MediaScanReport;
  assets: MediaAssetForScan[];
}> {
  const assets = await prisma.mediaAsset.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
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
      tenant: { select: { displayName: true } },
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

  const localExistingStorageKeys = new Set<string>();
  for (const asset of assets) {
    if (isLocalUrl(asset.url) && await storageKeyExists(asset.storageKey)) {
      localExistingStorageKeys.add(asset.storageKey);
    }
  }

  const report = buildMediaScanReport({
    now,
    localExistingStorageKeys,
    assets: assets.map((asset) => ({
      id: asset.id,
      url: asset.url,
      storageKey: asset.storageKey,
      kind: asset.kind,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      checksumSha256: asset.checksumSha256,
      tenantName: asset.tenant?.displayName ?? null,
      references: assetReferences(asset),
    })),
  });

  return { report, assets };
}

type AdminActor = Awaited<ReturnType<typeof requireAdminPermission>>;

function providerIdForAsset(asset: Pick<MediaAssetForScan, "url">) {
  return asset.url.includes("raw.githubusercontent.com") ? "github-current" : "local-public";
}

async function moveAssetsToTrash(input: {
  admin: AdminActor;
  assets: MediaAssetForScan[];
  startedAt: Date;
  title: string;
  mode: string;
  reason: string;
  eventCode: string;
  eventMessage: string;
  reclaimableBytes: number;
}) {
  const settings = await prisma.mediaSettings.upsert({
    where: { key: "default" },
    update: {},
    create: { key: "default" },
  });

  const finishedAt = new Date();
  const operation = await prisma.operation.create({
    data: {
      type: "MEDIA_CLEANUP",
      status: input.assets.length > 0 ? "SUCCEEDED" : "PARTIAL",
      title: input.title,
      progress: 1,
      totalItems: input.assets.length,
      processedItems: input.assets.length,
      startedAt: input.startedAt,
      finishedAt,
      lastHeartbeatAt: finishedAt,
      requestedByAdminId: input.admin.id,
      requestedByName: input.admin.name,
      cancellable: false,
      resumable: true,
      input: {
        mode: input.mode,
        source: "admin-media-page",
      },
      result: {
        movedToTrash: input.assets.length,
        reclaimableBytes: input.reclaimableBytes,
        note: "تم نقل الوسائط منطقيًا إلى سلة الوسائط فقط. لم يتم حذف أي ملف من التخزين.",
      },
    },
  });

  const trashedAt = new Date();
  const purgeEligibleAt = computePurgeEligibleAt({
    trashedAt,
    retentionDays: settings.trashRetentionDays,
  });

  for (const asset of input.assets) {
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
        providerId: providerIdForAsset(asset),
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
        trashReason: input.reason,
        trashActorId: input.admin.id,
        trashOperationId: operation.id,
      },
      update: {
        lifecycleStatus: "IN_TRASH",
        usageStatus: "UNUSED",
        trashedAt,
        purgeEligibleAt,
        trashReason: input.reason,
        trashActorId: input.admin.id,
        trashOperationId: operation.id,
        lastVerifiedAt: trashedAt,
      },
    });

    await prisma.mediaLifecycleEvent.create({
      data: {
        mediaId: catalog.id,
        operationId: operation.id,
        actorAdminId: input.admin.id,
        toLifecycleStatus: "IN_TRASH",
        toUsageStatus: "UNUSED",
        reason: input.reason,
        metadata: {
          storageKey: asset.storageKey,
          sizeBytes: asset.sizeBytes,
          providerId: providerIdForAsset(asset),
        },
      },
    });
  }

  await prisma.operationEvent.create({
    data: {
      operationId: operation.id,
      level: "INFO",
      code: input.eventCode,
      message: input.eventMessage,
      data: {
        movedToTrash: input.assets.length,
        reclaimableBytes: input.reclaimableBytes,
      },
    },
  });
}

export async function replaceMediaAction(formData: FormData) {
  await requireAdminPermission("media", "edit");

  const assetId = await readString(formData, "assetId");
  const file = formData.get("file");

  if (!assetId || !(file instanceof File) || file.size === 0) {
    throw new Error("بيانات غير صالحة");
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: { id: assetId, deletedAt: null },
  });

  if (!asset) throw new Error("الملف غير موجود");

  try {
    const processed = await processImageFromFile(file);

    const publicRoot = join(process.cwd(), "public");
    const absolutePath = join(publicRoot, asset.storageKey);

    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, processed.buffer);

    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        mimeType: processed.mimeType,
        sizeBytes: processed.sizeBytes,
        width: processed.width,
        height: processed.height,
      },
    });

    revalidatePath("/admin/media");
  } catch (error) {
    console.error("[replaceMedia] failed:", error);
    throw new Error("فشل استبدال الملف");
  }
}

export async function startMediaScanOperationAction() {
  const admin = await requireAdminPermission("media", "edit");

  const startedAt = new Date();
  const { report } = await collectMediaScanReport(startedAt);
  const totalItems = report.summary.totalAssets;
  const finishedAt = new Date();

  const operation = await prisma.operation.create({
    data: {
      type: "MEDIA_SCAN",
      status: "SUCCEEDED",
      title: "فحص الوسائط",
      progress: 1,
      totalItems,
      processedItems: totalItems,
      startedAt,
      finishedAt,
      lastHeartbeatAt: finishedAt,
      requestedByAdminId: admin.id,
      requestedByName: admin.name,
      cancellable: false,
      resumable: true,
      checkpoint: {
        scope: "legacy-media-assets",
        processedItems: totalItems,
      },
      input: {
        mode: "read-only",
        source: "admin-media-page",
      },
      result: {
        report,
        note: "تم تنفيذ فحص قراءة للجرد الحالي بدون حذف أو نقل.",
      },
    },
  });

  const findingInputs = [
    ...report.unusedAssets.map((asset) => ({
      operationId: operation.id,
      type: "UNUSED_MEDIA" as const,
      severity: "INFO" as const,
      message: `وسيط غير مستخدم: ${asset.fileName}`,
      evidence: asset,
    })),
    ...report.missingAssets.map((asset) => ({
      operationId: operation.id,
      type: "MISSING_OBJECT" as const,
      severity: "ERROR" as const,
      message: `ملف مفقود: ${asset.fileName}`,
      evidence: asset,
    })),
    ...report.duplicateGroups.map((group) => ({
      operationId: operation.id,
      type: "DUPLICATE_MEDIA" as const,
      severity: "WARNING" as const,
      message: `مجموعة تكرار: ${group.count} عناصر`,
      evidence: group,
    })),
  ];

  if (findingInputs.length > 0) {
    await prisma.mediaFinding.createMany({ data: findingInputs });
  }

  await prisma.operationEvent.create({
    data: {
      operationId: operation.id,
      level: "INFO",
      code: "MEDIA_SCAN_COMPLETED",
      message: "تم تنفيذ فحص الوسائط الحالي بدون أي حذف.",
      data: {
        summary: report.summary,
        source: "admin-media-page",
      },
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");
}

export async function moveUnusedMediaToTrashAction() {
  const admin = await requireAdminPermission("media", "edit");
  const startedAt = new Date();
  const { report, assets } = await collectMediaScanReport(startedAt);
  const unusedIds = new Set(report.unusedAssets.map((asset) => asset.id));
  const unusedAssets = assets.filter((asset) => unusedIds.has(asset.id));

  await moveAssetsToTrash({
    admin,
    assets: unusedAssets,
    startedAt,
    title: "نقل الوسائط غير المستخدمة إلى السلة",
    mode: "move-unused-to-trash",
    reason: "غير مستخدم حسب فحص الوسائط الحالي",
    eventCode: "MEDIA_UNUSED_MOVED_TO_TRASH",
    eventMessage: `تم نقل ${unusedAssets.length} وسيط غير مستخدم إلى السلة بدون حذف نهائي.`,
    reclaimableBytes: report.summary.reclaimableBytes,
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");
}

export async function moveDuplicateMediaToTrashAction() {
  const admin = await requireAdminPermission("media", "edit");
  const startedAt = new Date();
  const { report, assets } = await collectMediaScanReport(startedAt);
  const candidateIds = new Set(selectDuplicateCleanupCandidates(report).map((asset) => asset.id));
  const duplicateAssets = assets.filter((asset) => candidateIds.has(asset.id));
  const reclaimableBytes = duplicateAssets.reduce((total, asset) => total + asset.sizeBytes, 0);

  await moveAssetsToTrash({
    admin,
    assets: duplicateAssets,
    startedAt,
    title: "تنظيف النسخ المكررة غير المستخدمة",
    mode: "move-unused-duplicates-to-trash",
    reason: "نسخة مكررة غير مستخدمة حسب Hash وفحص المراجع الحالي",
    eventCode: "MEDIA_DUPLICATES_MOVED_TO_TRASH",
    eventMessage: `تم نقل ${duplicateAssets.length} نسخة مكررة غير مستخدمة إلى السلة بدون حذف نهائي.`,
    reclaimableBytes,
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");
}

export async function restoreTrashedMediaAction() {
  const admin = await requireAdminPermission("media", "edit");
  const startedAt = new Date();
  const entries = await prisma.mediaCatalogEntry.findMany({
    where: { lifecycleStatus: "IN_TRASH" },
    orderBy: { trashedAt: "desc" },
    take: 200,
  });
  const finishedAt = new Date();

  const operation = await prisma.operation.create({
    data: {
      type: "MEDIA_RESTORE",
      status: entries.length > 0 ? "SUCCEEDED" : "PARTIAL",
      title: "استعادة عناصر سلة الوسائط",
      progress: 1,
      totalItems: entries.length,
      processedItems: entries.length,
      startedAt,
      finishedAt,
      lastHeartbeatAt: finishedAt,
      requestedByAdminId: admin.id,
      requestedByName: admin.name,
      cancellable: false,
      resumable: true,
      input: {
        mode: "restore-trash",
        source: "admin-media-page",
      },
      result: {
        restored: entries.length,
        note: "تمت إعادة عناصر السلة إلى الحالة النشطة. لم يتم نقل أو حذف ملفات التخزين.",
      },
    },
  });

  for (const entry of entries) {
    await prisma.mediaCatalogEntry.update({
      where: { id: entry.id },
      data: {
        lifecycleStatus: "ACTIVE",
        usageStatus: "UNKNOWN",
        trashedAt: null,
        purgeEligibleAt: null,
        trashReason: null,
        trashActorId: null,
        trashOperationId: null,
        lastVerifiedAt: finishedAt,
      },
    });

    await prisma.mediaLifecycleEvent.create({
      data: {
        mediaId: entry.id,
        operationId: operation.id,
        actorAdminId: admin.id,
        fromLifecycleStatus: "IN_TRASH",
        toLifecycleStatus: "ACTIVE",
        fromUsageStatus: entry.usageStatus,
        toUsageStatus: "UNKNOWN",
        reason: "استعادة صريحة من لوحة إدارة الوسائط",
        metadata: {
          storageKey: entry.storageKey,
          previousTrashReason: entry.trashReason,
        },
      },
    });
  }

  await prisma.operationEvent.create({
    data: {
      operationId: operation.id,
      level: "INFO",
      code: "MEDIA_TRASH_RESTORED",
      message: `تمت استعادة ${entries.length} عنصر من سلة الوسائط.`,
      data: { restored: entries.length },
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");
}

export async function purgeEligibleMediaAction() {
  const admin = await requireAdminPermission("media", "edit");
  const startedAt = new Date();
  const entries = await prisma.mediaCatalogEntry.findMany({
    where: {
      lifecycleStatus: "IN_TRASH",
      purgeEligibleAt: { lte: startedAt },
    },
    orderBy: { purgeEligibleAt: "asc" },
    take: 200,
  });

  let purged = 0;
  let skippedBecauseUsed = 0;
  const finishedAt = new Date();
  const operation = await prisma.operation.create({
    data: {
      type: "MEDIA_PURGE",
      status: entries.length > 0 ? "SUCCEEDED" : "PARTIAL",
      title: "حذف نهائي للوسائط المؤهلة",
      progress: 1,
      totalItems: entries.length,
      processedItems: entries.length,
      startedAt,
      finishedAt,
      lastHeartbeatAt: finishedAt,
      requestedByAdminId: admin.id,
      requestedByName: admin.name,
      cancellable: false,
      resumable: true,
      input: {
        mode: "purge-eligible-trash",
        source: "admin-media-page",
        guard: "recheck-references-before-purge",
      },
      result: {
        purged: 0,
        skippedBecauseUsed: 0,
        note: "الحذف هنا يوسم الوسيط كمحذوف نهائيًا داخل قاعدة البيانات. حذف ملف التخزين الفعلي ينتظر ربط Storage Provider delete.",
      },
    },
  });

  for (const entry of entries) {
    const asset = entry.sourceKind === "CUSTOMER_MEDIA" && entry.sourceId
      ? await prisma.mediaAsset.findFirst({
          where: { id: entry.sourceId, deletedAt: null },
          select: {
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
        })
      : null;

    if (asset && totalReferenceCount(asset._count) > 0) {
      skippedBecauseUsed += 1;
      await prisma.mediaCatalogEntry.update({
        where: { id: entry.id },
        data: {
          lifecycleStatus: "ACTIVE",
          usageStatus: "USED",
          trashedAt: null,
          purgeEligibleAt: null,
          trashReason: null,
          trashActorId: null,
          trashOperationId: null,
          lastVerifiedAt: finishedAt,
        },
      });
      await prisma.mediaLifecycleEvent.create({
        data: {
          mediaId: entry.id,
          operationId: operation.id,
          actorAdminId: admin.id,
          fromLifecycleStatus: "IN_TRASH",
          toLifecycleStatus: "ACTIVE",
          fromUsageStatus: entry.usageStatus,
          toUsageStatus: "USED",
          reason: "تم إلغاء الحذف النهائي لأن الوسيط أصبح مستخدمًا مرة أخرى",
          metadata: {
            storageKey: entry.storageKey,
            referenceCount: totalReferenceCount(asset._count),
          },
        },
      });
      continue;
    }

    purged += 1;
    await prisma.mediaCatalogEntry.update({
      where: { id: entry.id },
      data: {
        lifecycleStatus: "PURGED",
        usageStatus: "UNUSED",
        purgedAt: finishedAt,
        lastVerifiedAt: finishedAt,
      },
    });

    if (entry.sourceKind === "CUSTOMER_MEDIA" && entry.sourceId) {
      await prisma.mediaAsset.updateMany({
        where: { id: entry.sourceId, deletedAt: null },
        data: { deletedAt: finishedAt },
      });
    }

    await prisma.mediaLifecycleEvent.create({
      data: {
        mediaId: entry.id,
        operationId: operation.id,
        actorAdminId: admin.id,
        fromLifecycleStatus: "IN_TRASH",
        toLifecycleStatus: "PURGED",
        fromUsageStatus: entry.usageStatus,
        toUsageStatus: "UNUSED",
        reason: "حذف نهائي صريح بعد انتهاء مدة الاحتفاظ وإعادة فحص المراجع",
        metadata: {
          storageKey: entry.storageKey,
          sizeBytes: entry.sizeBytes,
          providerId: entry.providerId,
          physicalStorageDelete: false,
        },
      },
    });
  }

  const status = skippedBecauseUsed > 0 ? "PARTIAL" : entries.length > 0 ? "SUCCEEDED" : "PARTIAL";
  await prisma.operation.update({
    where: { id: operation.id },
    data: {
      status,
      result: {
        purged,
        skippedBecauseUsed,
        note: "تمت حماية أي وسيط عاد استخدامه. حذف ملف التخزين الفعلي لم يتم بعد إلى أن يتم ربط Storage Provider delete.",
      },
    },
  });

  await prisma.operationEvent.create({
    data: {
      operationId: operation.id,
      level: skippedBecauseUsed > 0 ? "WARNING" : "INFO",
      code: "MEDIA_ELIGIBLE_PURGE_COMPLETED",
      message: `تم وسم ${purged} وسيط كمحذوف نهائيًا وتخطي ${skippedBecauseUsed} لأنه مستخدم.`,
      data: { purged, skippedBecauseUsed },
    },
  });

  revalidatePath("/admin/media");
  revalidatePath("/admin/operations");
}
