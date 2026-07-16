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

export async function saveUnifiedContentAction(formData: FormData) {
  const admin = await requireAdminPermission("templates", "edit");

  try {
    const currentContent = JSON.parse(fsReadFileSync(CONTENT_FILE, "utf-8"));
    const data = currentContent.data as UnifiedContent;

    data.photographerName = formData.get("photographerName") as string;
    data.studioName = formData.get("studioName") as string;
    data.description = formData.get("description") as string;
    data.heroImageUrl = formData.get("heroImageUrl") as string;
    data.heroEyebrow = formData.get("heroEyebrow") as string;
    data.heroCtaLabel = formData.get("heroCtaLabel") as string;

    data.packagesTitle = formData.get("packagesTitle") as string;
    data.packagesDescription = formData.get("packagesDescription") as string;
    data.packages = data.packages.map((pkg, index) => ({
      ...pkg,
      name: formData.get(`package_${index}_name`) as string,
      subtitle: formData.get(`package_${index}_subtitle`) as string,
      priceAmount: parseInt(formData.get(`package_${index}_price`) as string, 10),
      currency: formData.get(`package_${index}_currency`) as string,
      features: (formData.get(`package_${index}_features`) as string).split("\n").filter(f => f.trim()),
      isHighlighted: formData.get(`package_${index}_highlighted`) === "on",
    }));

    data.extrasTitle = formData.get("extrasTitle") as string;
    data.extrasDescription = formData.get("extrasDescription") as string;
    data.extras = data.extras.map((extra, index) => ({
      ...extra,
      name: formData.get(`extra_${index}_name`) as string,
      description: formData.get(`extra_${index}_description`) as string,
      priceAmount: parseInt(formData.get(`extra_${index}_price`) as string, 10),
      currency: formData.get(`extra_${index}_currency`) as string,
    }));

    data.galleryTitle = formData.get("galleryTitle") as string;
    data.galleryDescription = formData.get("galleryDescription") as string;
    data.gallery = data.gallery.map((image, index) => ({
      ...image,
      url: formData.get(`gallery_${index}_url`) as string,
      alt: formData.get(`gallery_${index}_alt`) as string,
      caption: formData.get(`gallery_${index}_caption`) as string,
    }));

    data.contactPhone = formData.get("contactPhone") as string;
    data.contactWhatsapp = formData.get("contactWhatsapp") as string;
    data.contactEmail = formData.get("contactEmail") as string;
    data.contactInstagram = formData.get("contactInstagram") as string;
    data.contactFacebook = formData.get("contactFacebook") as string;
    data.contactTiktok = formData.get("contactTiktok") as string;
    data.workLocation = formData.get("workLocation") as string;

    currentContent.version += 1;
    currentContent.updatedAt = new Date().toISOString();

    writeFileSync(CONTENT_FILE, JSON.stringify(currentContent, null, 2), "utf-8");
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, metadata: { action: "saveUnifiedContent" } });
    redirect(`/admin/templates?error=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/admin/content");
  redirect("/admin/templates?unifiedContentSaved=1");
}
