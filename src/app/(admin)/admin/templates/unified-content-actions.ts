"use server";

import { revalidatePath } from "next/cache";
import { writeFileSync, readFileSync as fsReadFileSync } from "node:fs";
import { join } from "node:path";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

const CONTENT_FILE = join(process.cwd(), "content", "templates", "unified-content.json");

function getFormValue(formData: FormData, key: string, fallback = ""): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : fallback;
}

export async function saveUnifiedContentAction(formData: FormData) {
  await requireAdminPermission("templates", "edit");

  const current = JSON.parse(fsReadFileSync(CONTENT_FILE, "utf-8"));
  const data = current.data as Record<string, unknown>;

  // hero
  const heroKeys = ["photographerName", "studioName", "workLocation", "description", "heroEyebrow", "heroCtaLabel", "heroImageUrl",
    "packagesTitle", "packagesDescription", "extrasTitle", "extrasDescription", "galleryTitle", "galleryDescription"];
  for (const k of heroKeys) {
    const v = getFormValue(formData, k);
    if (v) data[k] = v;
  }

  // packages
  const pkgCount = (data.packages as unknown[]).length;
  const newPackages: unknown[] = [];
  for (let i = 0; i < pkgCount; i++) {
    const old = (data.packages as Record<string, unknown>[])[i] || {};
    newPackages.push({
      ...old,
      id: getFormValue(formData, `pkg_${i}_id`) || old.id,
      name: getFormValue(formData, `pkg_${i}_name`) || old.name,
      subtitle: getFormValue(formData, `pkg_${i}_subtitle`) || old.subtitle || "",
      priceAmount: parseInt(getFormValue(formData, `pkg_${i}_price`), 10) || old.priceAmount || 0,
      currency: getFormValue(formData, `pkg_${i}_currency`) || old.currency || "EGP",
      imageUrl: getFormValue(formData, `pkg_${i}_imageUrl`) || old.imageUrl || "",
      features: (getFormValue(formData, `pkg_${i}_features`) || (old.features as string[])?.join("\n") || "").split("\n").filter(f => f.trim()),
      isHighlighted: formData.get(`pkg_${i}_highlighted`) === "on",
      sortOrder: old.sortOrder || i,
    });
  }
  data.packages = newPackages;

  // extras
  const extCount = (data.extras as unknown[]).length;
  const newExtras: unknown[] = [];
  for (let i = 0; i < extCount; i++) {
    const old = (data.extras as Record<string, unknown>[])[i] || {};
    newExtras.push({
      ...old,
      id: getFormValue(formData, `ext_${i}_id`) || old.id,
      name: getFormValue(formData, `ext_${i}_name`) || old.name,
      description: getFormValue(formData, `ext_${i}_description`) || old.description || "",
      priceAmount: parseInt(getFormValue(formData, `ext_${i}_price`), 10) || old.priceAmount || 0,
      currency: getFormValue(formData, `ext_${i}_currency`) || old.currency || "EGP",
      iconKey: old.iconKey || "video",
      sortOrder: old.sortOrder || i,
    });
  }
  data.extras = newExtras;

  // gallery
  const galCount = (data.gallery as unknown[]).length;
  const newGallery: unknown[] = [];
  for (let i = 0; i < galCount; i++) {
    const old = (data.gallery as Record<string, unknown>[])[i] || {};
    newGallery.push({
      ...old,
      id: getFormValue(formData, `gal_${i}_id`) || old.id,
      url: getFormValue(formData, `gal_${i}_url`) || old.url || "",
      alt: getFormValue(formData, `gal_${i}_alt`) || old.alt || "",
      caption: getFormValue(formData, `gal_${i}_caption`) || old.caption || "",
      sortOrder: old.sortOrder || i,
      isFeatured: old.isFeatured || false,
    });
  }
  data.gallery = newGallery;

  // contact
  const contactKeys = ["contactPhone", "contactWhatsapp", "contactEmail", "contactInstagram", "contactFacebook", "contactTiktok"];
  for (const k of contactKeys) {
    const v = getFormValue(formData, k);
    if (v) data[k] = v;
  }

  current.version = (current.version || 0) + 1;
  current.updatedAt = new Date().toISOString();

  writeFileSync(CONTENT_FILE, JSON.stringify(current, null, 2), "utf-8");

  revalidatePath("/admin/templates");
  revalidatePath("/admin/content");
  revalidatePath("/templates");
}
