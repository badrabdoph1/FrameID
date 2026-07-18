import "server-only";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

import { prisma } from "@/lib/prisma";

type AssetUsage = {
  assetId: string;
  url: string;
  references: Array<{ table: string; recordId: string; field: string }>;
};

export async function findAssetUsage(assetId: string): Promise<AssetUsage | null> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { id: true, url: true },
  });
  if (!asset) return null;

  const refs: AssetUsage["references"] = [];

  const gal = await prisma.galleryImage.findFirst({
    where: { assetId, deletedAt: null },
    select: { id: true },
  });
  if (gal) refs.push({ table: "galleryImage", recordId: gal.id, field: "assetId" });

  const galCovers = await prisma.galleryAlbum.findFirst({
    where: { coverAssetId: assetId, deletedAt: null },
    select: { id: true },
  });
  if (galCovers) refs.push({ table: "galleryAlbum", recordId: galCovers.id, field: "coverAssetId" });

  const contactAvatar = await prisma.contactProfile.findFirst({
    where: { avatarAssetId: assetId },
    select: { id: true },
  });
  if (contactAvatar) refs.push({ table: "contactProfile", recordId: contactAvatar.id, field: "avatarAssetId" });

  const contactCover = await prisma.contactProfile.findFirst({
    where: { coverAssetId: assetId },
    select: { id: true },
  });
  if (contactCover) refs.push({ table: "contactProfile", recordId: contactCover.id, field: "coverAssetId" });

  const seo = await prisma.sEOSettings.findFirst({
    where: { ogAssetId: assetId, deletedAt: null },
    select: { id: true },
  });
  if (seo) refs.push({ table: "sEOSettings", recordId: seo.id, field: "ogAssetId" });

  const paymentProof = await prisma.paymentRequest.findFirst({
    where: { proofAssetId: assetId, deletedAt: null },
    select: { id: true },
  });
  if (paymentProof) refs.push({ table: "paymentRequest", recordId: paymentProof.id, field: "proofAssetId" });

  const qrCodes = await prisma.paymentAccount.findFirst({
    where: { qrAssetId: assetId, deletedAt: null },
    select: { id: true },
  });
  if (qrCodes) refs.push({ table: "paymentAccount", recordId: qrCodes.id, field: "qrAssetId" });

  const qrSettings = await prisma.paymentSettings.findFirst({
    where: { qrCodeAssetId: assetId },
    select: { id: true },
  });
  if (qrSettings) refs.push({ table: "paymentSettings", recordId: qrSettings.id, field: "qrCodeAssetId" });

  return { assetId: asset.id, url: asset.url, references: refs };
}

export async function findUnusedAssets(
  tenantId?: string,
): Promise<Array<{ id: string; url: string; createdAt: Date }>> {
  const where: Record<string, unknown> = { deletedAt: null };
  if (tenantId) where.tenantId = tenantId;

  const all = await prisma.mediaAsset.findMany({
    where,
    select: { id: true, url: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const unused: Array<{ id: string; url: string; createdAt: Date }> = [];
  for (const asset of all) {
    const usage = await findAssetUsage(asset.id);
    if (!usage || usage.references.length === 0) {
      unused.push(asset);
    }
  }
  return unused;
}

export async function deleteAssetFiles(assets: Array<{ id: string; url: string }>): Promise<{ deleted: number; failed: Array<{ id: string; error: string }> }> {
  let deleted = 0;
  const failed: Array<{ id: string; error: string }> = [];

  for (const asset of assets) {
    const usage = await findAssetUsage(asset.id);
    if (usage && usage.references.length > 0) {
      failed.push({ id: asset.id, error: `لا يزال مستخدمًا في: ${usage.references.map((r) => `${r.table}.${r.field}`).join(", ")}` });
      continue;
    }

    if (asset.url.startsWith("http")) {
      try {
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: { deletedAt: new Date() },
        });
        deleted++;
      } catch (error) {
        failed.push({ id: asset.id, error: error instanceof Error ? error.message : "فشل الحذف من قاعدة البيانات" });
      }
      continue;
    }

    const localPath = join(process.cwd(), "public", asset.url);
    try {
      await unlink(localPath);
    } catch {
      // File may not exist locally (e.g. GitHub raw URLs, Unsplash URLs)
    }

    try {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { deletedAt: new Date() },
      });
      deleted++;
    } catch (error) {
      failed.push({ id: asset.id, error: error instanceof Error ? error.message : "فشل الحذف من قاعدة البيانات" });
    }
  }

  return { deleted, failed };
}
