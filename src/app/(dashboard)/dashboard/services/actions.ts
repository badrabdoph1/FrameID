"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";

export async function addPackageAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const name = readString(formData, "name");
  const subtitle = readString(formData, "subtitle");
  const priceAmount = readMoney(formData, "priceAmount");
  const features = readString(formData, "features")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!name || priceAmount <= 0) {
    redirect("/dashboard/services?error=invalid-package");
  }

  const sortOrder = await nextPackageOrder(session.site.id);

  await prisma.package.create({
    data: {
      siteId: session.site.id,
      name,
      subtitle: subtitle || null,
      priceAmount,
      currency: "EGP",
      features,
      isHighlighted: formData.get("isHighlighted") === "on",
      sortOrder
    }
  });

  revalidatePath("/dashboard/services");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/services?created=package");
}

export async function addExtraAction(formData: FormData) {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const name = readString(formData, "name");
  const priceAmount = readMoney(formData, "priceAmount");

  if (!name || priceAmount <= 0) {
    redirect("/dashboard/services?error=invalid-extra");
  }

  const sortOrder = await nextExtraOrder(session.site.id);

  await prisma.extraService.create({
    data: {
      siteId: session.site.id,
      name,
      priceAmount,
      currency: "EGP",
      iconKey: readString(formData, "iconKey") || null,
      sortOrder
    }
  });

  revalidatePath("/dashboard/services");
  revalidatePath(`/p/${session.site.slug}`);
  redirect("/dashboard/services?created=extra");
}

async function nextPackageOrder(siteId: string): Promise<number> {
  const result = await prisma.package.aggregate({
    where: {
      siteId,
      deletedAt: null
    },
    _max: {
      sortOrder: true
    }
  });

  return (result._max.sortOrder ?? -1) + 1;
}

async function nextExtraOrder(siteId: string): Promise<number> {
  const result = await prisma.extraService.aggregate({
    where: {
      siteId,
      deletedAt: null
    },
    _max: {
      sortOrder: true
    }
  });

  return (result._max.sortOrder ?? -1) + 1;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readMoney(formData: FormData, key: string): number {
  const value = readString(formData, key).replace(/[,_\s]/gu, "");
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
