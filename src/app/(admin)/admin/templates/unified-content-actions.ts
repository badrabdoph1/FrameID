"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFileSync, readFileSync as fsReadFileSync } from "node:fs";
import { join } from "node:path";

import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import type { UnifiedTemplateContentSchema } from "@/lib/content/schemas/templates";
import type { z } from "zod";

type UnifiedContent = z.infer<typeof UnifiedTemplateContentSchema>;

const CONTENT_FILE = join(process.cwd(), "content", "templates", "unified-content.json");

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readInt(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : fallback;
}

function readBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export async function saveUnifiedContentAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");

  try {
    const currentContent = JSON.parse(fsReadFileSync(CONTENT_FILE, "utf-8"));
    const data = currentContent.data as UnifiedContent;

    data.photographerName = readString(formData, "photographerName");
    data.studioName = readString(formData, "studioName");
    data.description = readString(formData, "description");
    data.heroImageUrl = readString(formData, "heroImageUrl");
    data.heroEyebrow = readString(formData, "heroEyebrow");
    data.heroCtaLabel = readString(formData, "heroCtaLabel");
    data.workLocation = readString(formData, "workLocation");

    data.packagesTitle = readString(formData, "packagesTitle");
    data.packagesDescription = readString(formData, "packagesDescription");
    data.packages = data.packages.map((pkg, index) => ({
      ...pkg,
      name: readString(formData, `package_${index}_name`) || pkg.name,
      subtitle: readString(formData, `package_${index}_subtitle`),
      priceAmount: readInt(formData, `package_${index}_price`, pkg.priceAmount),
      currency: readString(formData, `package_${index}_currency`) || pkg.currency,
      imageUrl: readString(formData, `package_${index}_imageUrl`) || pkg.imageUrl,
      features: readString(formData, `package_${index}_features`)
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      isHighlighted: readBool(formData, `package_${index}_highlighted`),
      sortOrder: readInt(formData, `package_${index}_sortOrder`, pkg.sortOrder),
    }));

    data.extrasTitle = readString(formData, "extrasTitle");
    data.extrasDescription = readString(formData, "extrasDescription");
    data.extras = data.extras.map((extra, index) => ({
      ...extra,
      name: readString(formData, `extra_${index}_name`) || extra.name,
      description: readString(formData, `extra_${index}_description`),
      priceAmount: readInt(formData, `extra_${index}_price`, extra.priceAmount),
      currency: readString(formData, `extra_${index}_currency`) || extra.currency,
      iconKey: readString(formData, `extra_${index}_iconKey`) || extra.iconKey,
      sortOrder: readInt(formData, `extra_${index}_sortOrder`, extra.sortOrder),
    }));

    data.galleryTitle = readString(formData, "galleryTitle");
    data.galleryDescription = readString(formData, "galleryDescription");
    data.gallery = data.gallery.map((image, index) => ({
      ...image,
      url: readString(formData, `gallery_${index}_url`) || image.url,
      alt: readString(formData, `gallery_${index}_alt`),
      caption: readString(formData, `gallery_${index}_caption`),
      sortOrder: readInt(formData, `gallery_${index}_sortOrder`, image.sortOrder),
      isFeatured: readBool(formData, `gallery_${index}_isFeatured`),
    }));

    data.contactPhone = readString(formData, "contactPhone") || null;
    data.contactWhatsapp = readString(formData, "contactWhatsapp") || null;
    data.contactEmail = readString(formData, "contactEmail") || null;
    data.contactInstagram = readString(formData, "contactInstagram") || null;
    data.contactFacebook = readString(formData, "contactFacebook") || null;
    data.contactTiktok = readString(formData, "contactTiktok") || null;

    currentContent.version += 1;
    currentContent.updatedAt = new Date().toISOString();

    writeFileSync(CONTENT_FILE, JSON.stringify(currentContent, null, 2), "utf-8");
    void admin;
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "saveUnifiedContent" } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/templates");
  revalidatePath("/templates/[code]/preview");
  redirect("/admin/templates?unifiedContentSaved=1");
}
