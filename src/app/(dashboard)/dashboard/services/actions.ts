"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readMoney(formData: FormData, key: string): number {
  const value = readString(formData, key).replace(/[,_\s]/gu, "");
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readBool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

function readFeatures(formData: FormData): string[] {
  const rows = formData
    .getAll("feature")
    .map((item) => typeof item === "string" ? item.trim() : "")
    .filter(Boolean);

  if (rows.length > 0) return rows;

  const legacy = readString(formData, "features");
  if (!legacy) return [];

  try {
    const parsed = JSON.parse(legacy);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // fallback to lines below
  }

  return legacy.split("\n").map((item) => item.trim()).filter(Boolean);
}

async function nextPackageOrder(siteId: string): Promise<number> {
  const result = await prisma.package.aggregate({
    where: { siteId, deletedAt: null },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? -1) + 1;
}

async function nextExtraOrder(siteId: string): Promise<number> {
  const result = await prisma.extraService.aggregate({
    where: { siteId, deletedAt: null },
    _max: { sortOrder: true },
  });
  return (result._max.sortOrder ?? -1) + 1;
}

function revalidateCustomerServices(siteSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");
  revalidatePath(`/p/${siteSlug}`);
}

export async function addPackageAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const name = readString(formData, "name");
  const subtitle = readString(formData, "subtitle");
  const priceAmount = readMoney(formData, "priceAmount");
  const features = readFeatures(formData);

  if (!name || priceAmount <= 0) {
    redirect("/dashboard/services?error=invalid-package");
  }

  try {
    const sortOrder = await nextPackageOrder(session.site.id);
    await prisma.package.create({
      data: {
        siteId: session.site.id,
        name,
        subtitle: subtitle || null,
        priceAmount,
        currency: readString(formData, "currency") || "EGP",
        features,
        isHighlighted: readBool(formData, "isHighlighted"),
        isActive: true,
        sortOrder,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "addPackage" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?created=package");
}

export async function updatePackageAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  if (!id) return;

  try {
    await prisma.package.update({
      where: { id, siteId: session.site.id },
      data: {
        name: readString(formData, "name"),
        subtitle: readString(formData, "subtitle") || null,
        priceAmount: readMoney(formData, "priceAmount"),
        currency: readString(formData, "currency") || "EGP",
        features: readFeatures(formData),
        isHighlighted: readBool(formData, "isHighlighted"),
        isActive: readBool(formData, "isActive"),
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updatePackage" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?updated=package");
}

export async function deletePackageAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  if (!id) return;

  try {
    await prisma.package.update({
      where: { id, siteId: session.site.id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "deletePackage" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?deleted=package");
}

export async function duplicatePackageAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  if (!id) return;

  try {
    const original = await prisma.package.findFirst({
      where: { id, siteId: session.site.id, deletedAt: null },
    });
    if (!original) return;

    const sortOrder = await nextPackageOrder(session.site.id);

    await prisma.package.create({
      data: {
        siteId: session.site.id,
        name: `${original.name} (نسخة)`,
        subtitle: original.subtitle,
        priceAmount: original.priceAmount,
        currency: original.currency,
        features: original.features as string[],
        isHighlighted: false,
        isActive: false,
        sortOrder,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "duplicatePackage" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?duplicated=package");
}

export async function reorderPackageAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  const direction = readString(formData, "direction");
  if (!id || !direction) return;

  try {
    const current = await prisma.package.findFirst({
      where: { id, siteId: session.site.id, deletedAt: null },
    });
    if (!current) return;

    const adjacent = await prisma.package.findFirst({
      where: {
        siteId: session.site.id,
        deletedAt: null,
        sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });
    if (!adjacent) return;

    await prisma.$transaction([
      prisma.package.update({ where: { id: current.id }, data: { sortOrder: adjacent.sortOrder } }),
      prisma.package.update({ where: { id: adjacent.id }, data: { sortOrder: current.sortOrder } }),
    ]);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "reorderPackage" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?reordered=package");
}

export async function addExtraAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const name = readString(formData, "name");
  const priceAmount = readMoney(formData, "priceAmount");

  if (!name || priceAmount <= 0) {
    redirect("/dashboard/services?error=invalid-extra");
  }

  try {
    const sortOrder = await nextExtraOrder(session.site.id);
    await prisma.extraService.create({
      data: {
        siteId: session.site.id,
        name,
        priceAmount,
        currency: readString(formData, "currency") || "EGP",
        iconKey: readString(formData, "iconKey") || null,
        description: readString(formData, "description") || null,
        isActive: true,
        sortOrder,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "addExtra" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?created=extra");
}

export async function updateExtraAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  if (!id) return;

  try {
    await prisma.extraService.update({
      where: { id, siteId: session.site.id },
      data: {
        name: readString(formData, "name"),
        priceAmount: readMoney(formData, "priceAmount"),
        currency: readString(formData, "currency") || "EGP",
        iconKey: readString(formData, "iconKey") || null,
        description: readString(formData, "description") || null,
        isActive: readBool(formData, "isActive"),
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "updateExtra" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?updated=extra");
}

export async function deleteExtraAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  if (!id) return;

  try {
    await prisma.extraService.update({
      where: { id, siteId: session.site.id },
      data: { deletedAt: new Date() },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "deleteExtra" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?deleted=extra");
}

export async function duplicateExtraAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  if (!id) return;

  try {
    const original = await prisma.extraService.findFirst({
      where: { id, siteId: session.site.id, deletedAt: null },
    });
    if (!original) return;

    const sortOrder = await nextExtraOrder(session.site.id);

    await prisma.extraService.create({
      data: {
        siteId: session.site.id,
        name: `${original.name} (نسخة)`,
        priceAmount: original.priceAmount,
        currency: original.currency,
        iconKey: original.iconKey,
        description: original.description,
        isActive: false,
        sortOrder,
      },
    });
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "duplicateExtra" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?duplicated=extra");
}

export async function reorderExtraAction(formData: FormData) {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");

  const id = readString(formData, "id");
  const direction = readString(formData, "direction");
  if (!id || !direction) return;

  try {
    const current = await prisma.extraService.findFirst({
      where: { id, siteId: session.site.id, deletedAt: null },
    });
    if (!current) return;

    const adjacent = await prisma.extraService.findFirst({
      where: {
        siteId: session.site.id,
        deletedAt: null,
        sortOrder: direction === "up" ? { lt: current.sortOrder } : { gt: current.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });
    if (!adjacent) return;

    await prisma.$transaction([
      prisma.extraService.update({ where: { id: current.id }, data: { sortOrder: adjacent.sortOrder } }),
      prisma.extraService.update({ where: { id: adjacent.id }, data: { sortOrder: current.sortOrder } }),
    ]);
  } catch (error) {
    const { userError } = await processError(error, {
      userId: session.user.id,
      tenantId: session.tenant.id,
      metadata: { action: "reorderExtra" },
    });
    redirect(`/dashboard/services?error=${encodeURIComponent(userError.message)}`);
  }

  revalidateCustomerServices(session.site.slug);
  redirect("/dashboard/services?reordered=extra");
}
