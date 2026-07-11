"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { uploadPlatformTemplateImage } from "@/modules/media/platform-image-upload";
import {
  normalizeTemplateStarterSharedDefaults,
  serializeTemplateStarterDefaults,
  TEMPLATE_STARTER_DEFAULTS_CODE,
} from "@/modules/themes/template-starter-defaults";

type JsonRecord = Record<string, unknown>;

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function readJsonArray(formData: FormData, key: string): JsonRecord[] {
  const raw = readString(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  } catch {
    throw new Error(`تعذر قراءة بيانات ${key}. أعد تحميل الصفحة وحاول مرة أخرى.`);
  }
}

async function uploadReplacement(formData: FormData, key: string): Promise<string | null> {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size <= 0) return null;
  return (await uploadPlatformTemplateImage(file)).url;
}

async function resolveGallery(formData: FormData): Promise<JsonRecord[]> {
  const items = readJsonArray(formData, "galleryImagesJson");
  return Promise.all(items.map(async (item, index) => {
    const uploaded = await uploadReplacement(formData, `galleryImage_${index}`);
    const currentUrl = typeof item.url === "string" && !item.url.startsWith("blob:") ? item.url : "";
    return {
      ...item,
      id: typeof item.id === "string" && item.id ? item.id : `gallery-${index + 1}`,
      url: uploaded || currentUrl,
      alt: typeof item.alt === "string" && item.alt.trim() ? item.alt.trim() : `صورة المعرض ${index + 1}`,
      caption: typeof item.caption === "string" ? item.caption.trim() : "",
      sortOrder: index,
      isFeatured: item.isFeatured === true,
    };
  }));
}

async function resolvePackages(formData: FormData): Promise<JsonRecord[]> {
  const items = readJsonArray(formData, "packagesJson");
  return Promise.all(items.map(async (item, index) => {
    const uploaded = await uploadReplacement(formData, `packageImage_${index}`);
    const currentUrl = typeof item.imageUrl === "string" && !item.imageUrl.startsWith("blob:") ? item.imageUrl : "";
    const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : `باقة ${index + 1}`;
    const features = Array.isArray(item.features) ? item.features.map(String).map((value) => value.trim()).filter(Boolean) : [];
    return {
      ...item,
      id: typeof item.id === "string" && item.id ? item.id : `package-${index + 1}`,
      name,
      subtitle: typeof item.subtitle === "string" ? item.subtitle.trim() : "",
      priceAmount: Number.isFinite(Number(item.priceAmount)) ? Math.max(0, Number(item.priceAmount)) : 0,
      currency: typeof item.currency === "string" && item.currency.trim() ? item.currency.trim().toUpperCase() : "EGP",
      features: features.length ? features : ["تفاصيل الباقة"],
      imageUrl: uploaded || currentUrl,
      isHighlighted: item.isHighlighted === true,
      sortOrder: index,
    };
  }));
}

function resolveExtras(formData: FormData): JsonRecord[] {
  return readJsonArray(formData, "extrasJson").map((item, index) => ({
    ...item,
    id: typeof item.id === "string" && item.id ? item.id : `extra-${index + 1}`,
    name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : `خدمة إضافية ${index + 1}`,
    description: typeof item.description === "string" ? item.description.trim() : "",
    priceAmount: Number.isFinite(Number(item.priceAmount)) ? Math.max(0, Number(item.priceAmount)) : 0,
    currency: typeof item.currency === "string" && item.currency.trim() ? item.currency.trim().toUpperCase() : "EGP",
    iconKey: typeof item.iconKey === "string" && item.iconKey ? item.iconKey : "camera",
    sortOrder: index,
  }));
}

function stripDuplicatedContent(value: unknown): Prisma.InputJsonValue {
  const source = value && typeof value === "object" && !Array.isArray(value) ? { ...(value as JsonRecord) } : {};
  delete source.packages;
  delete source.extras;
  delete source.gallery;
  delete source.seo;
  delete source.hero;
  delete source.sharedDefaults;
  return source as Prisma.InputJsonValue;
}

export async function saveStarterDefaultsAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");

  try {
    const heroUpload = await uploadReplacement(formData, "heroImage");
    const galleryImages = await resolveGallery(formData);
    const packages = await resolvePackages(formData);
    const extras = resolveExtras(formData);

    const defaults = normalizeTemplateStarterSharedDefaults({
      photographerName: readString(formData, "photographerName"),
      studioName: readString(formData, "studioName"),
      description: readString(formData, "description"),
      heroImageUrl: heroUpload || readString(formData, "heroImageUrl"),
      galleryImages,
      packages,
      extras,
      seo: {
        title: readString(formData, "seoTitle"),
        description: readString(formData, "seoDescription"),
        canonicalUrl: readString(formData, "seoCanonicalUrl"),
        robotsIndex: readBool(formData, "seoRobotsIndex"),
      },
      commonTexts: {
        galleryTitle: readString(formData, "galleryTitle"),
        galleryDescription: readString(formData, "galleryDescription"),
        packagesTitle: readString(formData, "packagesTitle"),
        packagesDescription: readString(formData, "packagesDescription"),
        extrasTitle: readString(formData, "extrasTitle"),
        extrasDescription: readString(formData, "extrasDescription"),
        contactTitle: readString(formData, "contactTitle"),
        contactCallToAction: readString(formData, "contactCallToAction"),
      },
    });

    const theme = await prisma.theme.findFirst({ where: { deletedAt: null }, orderBy: [{ status: "desc" }, { createdAt: "asc" }], select: { id: true } });
    if (!theme) throw new Error("لا يوجد ثيم متاح لحفظ بيانات البداية.");

    const saved = await prisma.template.upsert({
      where: { code: TEMPLATE_STARTER_DEFAULTS_CODE },
      create: { themeId: theme.id, code: TEMPLATE_STARTER_DEFAULTS_CODE, name: "Starter Content Defaults", status: "ARCHIVED", showroomOrder: -1, previewData: serializeTemplateStarterDefaults(defaults) as Prisma.InputJsonValue, settings: { internal: true, source: "template-content-source" } as Prisma.InputJsonValue },
      update: { previewData: serializeTemplateStarterDefaults(defaults) as Prisma.InputJsonValue, settings: { internal: true, source: "template-content-source" } as Prisma.InputJsonValue, deletedAt: null },
    });

    const templates = await prisma.template.findMany({ where: { code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } }, select: { id: true, previewData: true } });
    await prisma.$transaction(templates.map((template) => prisma.template.update({ where: { id: template.id }, data: { previewData: stripDuplicatedContent(template.previewData) } })));

    await prisma.auditLog.create({ data: { action: "TEMPLATE_STARTER_DEFAULTS_UPDATED", entityType: "TemplateContentSource", entityId: saved.id, metadata: { adminId: admin.id, adminEmail: admin.email, code: TEMPLATE_STARTER_DEFAULTS_CODE, cleanedTemplates: templates.length, sourceOfTruth: "template-content-source", galleryImages: galleryImages.length, packages: packages.length, extras: extras.length } as Prisma.InputJsonObject } });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveStarterDefaults" } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  revalidatePath("/admin/content");
  redirect("/admin/templates?starterDefaultsSaved=1");
}
