"use server";

import { revalidatePath } from "next/cache";

import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";
import { getPlatformPageDefinition } from "@/modules/platform-pages/page-catalog";
import { createPrismaPlatformPageRepository } from "@/modules/platform-pages/prisma-page-repository";
import { createPrismaPlatformPageImageRepository } from "@/modules/platform-pages/prisma-page-image-repository";
import { createPlatformPageImageService } from "@/modules/platform-pages/platform-page-image-service";
import { createPlatformPageMediaStorage } from "@/modules/platform-pages/platform-page-media-storage";
import {
  PlatformPageConflictError,
  createPlatformPageService,
} from "@/modules/platform-pages/page-service";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";
import { commitPlatformAssetToGitHub } from "@/lib/content/git-sync";

type SavePlatformPageActionInput = {
  pageKey: string;
  expectedVersion: number;
  document: PlatformPageDocument;
};

export type SavePlatformPageActionResult =
  | { success: true; version: number; revision: { id: string; version: number; actorName: string | null; createdAt: string; changeSummary: string | null } }
  | { success: false; reason: "conflict" | "validation" | "unavailable"; message: string; currentVersion?: number };

type RestorePlatformPageRevisionActionInput = {
  pageKey: string;
  revisionId: string;
  expectedVersion: number;
};

export type RestorePlatformPageRevisionActionResult =
  | { success: true; version: number; document: PlatformPageDocument; revision: { id: string; version: number; actorName: string | null; createdAt: string; changeSummary: string | null } }
  | { success: false; reason: "conflict" | "validation" | "unavailable"; message: string; currentVersion?: number };

export type UploadPlatformPageImageActionResult =
  | {
      success: true;
      asset: {
        assetId: string;
        url: string;
        focusX: number;
        focusY: number;
        zoom: number;
      };
    }
  | { success: false; message: string };

export async function uploadPlatformPageImageAction(
  formData: FormData,
): Promise<UploadPlatformPageImageActionResult> {
  const admin = await requireAdminPermission("content", "edit");
  const file = formData.get("file");
  const focusX = Number(formData.get("focusX"));
  const focusY = Number(formData.get("focusY"));
  const zoom = Number(formData.get("zoom"));

  if (!(file instanceof File)) {
    return { success: false, message: "اختر صورة أولًا." };
  }

  try {
    const service = createPlatformPageImageService({
      storage: createPlatformPageMediaStorage(),
      repository: createPrismaPlatformPageImageRepository(),
    });
    const stored = await service.upload({
      bytes: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      originalName: file.name,
      focusX,
      focusY,
      zoom,
      actorId: admin.id,
    });

    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const publicRoot = process.env.PLATFORM_MEDIA_PUBLIC_ROOT?.trim() || join(process.cwd(), "public");
    const filePath = `public${stored.url}`;
    const fileBytes = new Uint8Array(await readFile(join(publicRoot, stored.url.replace(/^\//, ""))));

    const gitResult = await commitPlatformAssetToGitHub({
      path: filePath,
      bytes: fileBytes,
      message: `رفع صورة صفحة منصة: ${file.name}`,
    });
    if (!gitResult.commitSha && gitResult.enabled) {
      console.error("[platform-page-image] Git commit failed:", gitResult.error);
    }

    return {
      success: true,
      asset: { assetId: stored.id, url: stored.url, focusX, focusY, zoom },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "تعذر تجهيز الصورة.",
    };
  }
}

export async function restorePlatformPageRevisionAction(
  input: RestorePlatformPageRevisionActionInput,
): Promise<RestorePlatformPageRevisionActionResult> {
  const admin = await requireAdminPermission("content", "edit");
  const definition = getPlatformPageDefinition(input.pageKey);

  if (!definition || definition.availability !== "editable") {
    return { success: false, reason: "unavailable", message: "هذه الصفحة غير متاحة للتحرير بعد." };
  }

  try {
    const service = createPlatformPageService(createPrismaPlatformPageRepository());
    const result = await service.restore({
      pageKey: definition.key,
      revisionId: input.revisionId,
      route: definition.route,
      kind: definition.kind,
      expectedVersion: input.expectedVersion,
      actor: { id: admin.id, name: admin.name, email: admin.email },
    });

    revalidatePath(definition.route);
    revalidatePath(`/admin/content/pages/${definition.key}`);
    revalidatePath("/admin/content");

    await syncPlatformConfigurationToGitHub({
      actor: admin,
      reason: `استعادة نسخة من صفحة ${definition.key}`,
    });

    return {
      success: true,
      version: result.page.version,
      document: result.page.document,
      revision: {
        id: result.revisionId,
        version: result.page.version,
        actorName: admin.name,
        createdAt: new Date().toISOString(),
        changeSummary: "استعادة نسخة سابقة",
      },
    };
  } catch (error) {
    if (error instanceof PlatformPageConflictError) {
      return {
        success: false,
        reason: "conflict",
        message: "توجد نسخة أحدث من الصفحة. أعد تحميل الصفحة قبل الاسترجاع.",
        currentVersion: error.currentVersion,
      };
    }

    return {
      success: false,
      reason: "validation",
      message: error instanceof Error ? error.message : "تعذر استعادة النسخة.",
    };
  }
}

export async function savePlatformPageAction(
  input: SavePlatformPageActionInput,
): Promise<SavePlatformPageActionResult> {
  const admin = await requireAdminPermission("content", "edit");
  const definition = getPlatformPageDefinition(input.pageKey);

  if (!definition || definition.availability !== "editable") {
    return {
      success: false,
      reason: "unavailable",
      message: "هذه الصفحة غير متاحة للتحرير بعد.",
    };
  }

  try {
    const service = createPlatformPageService(createPrismaPlatformPageRepository());
    const result = await service.save({
      pageKey: definition.key,
      route: definition.route,
      kind: definition.kind,
      expectedVersion: input.expectedVersion,
      document: input.document,
      actor: { id: admin.id, name: admin.name, email: admin.email },
      changeSummary: "تحديث محتوى الصفحة",
    });

    revalidatePath(definition.route);
    revalidatePath(`/admin/content/pages/${definition.key}`);
    revalidatePath("/admin/content");

    await syncPlatformConfigurationToGitHub({
      actor: admin,
      reason: `حفظ صفحة ${definition.key}`,
    });

    return {
      success: true,
      version: result.page.version,
      revision: {
        id: result.revisionId,
        version: result.page.version,
        actorName: admin.name,
        createdAt: new Date().toISOString(),
        changeSummary: "تحديث محتوى الصفحة",
      },
    };
  } catch (error) {
    if (error instanceof PlatformPageConflictError) {
      return {
        success: false,
        reason: "conflict",
        message: "حفظ مستخدم آخر نسخة أحدث. أعد تحميل الصفحة قبل متابعة التعديل.",
        currentVersion: error.currentVersion,
      };
    }

    return {
      success: false,
      reason: "validation",
      message: error instanceof Error ? error.message : "تعذر حفظ الصفحة.",
    };
  }
}
