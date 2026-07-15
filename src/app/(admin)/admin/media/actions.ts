"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

import { prisma } from "@/lib/prisma";
import { processImageFromFile } from "@/modules/media/image-processing-service";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

async function readString(formData: FormData, key: string): Promise<string> {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
