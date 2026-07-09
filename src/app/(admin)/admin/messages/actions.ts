"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import {
  ACTIVATION_TEMPLATE_CATEGORY,
  CUSTOMER_BROADCAST_CATEGORY,
  type ActivationTemplateKey,
  encodeActivationTemplatePayload,
  getActivationTemplateDefinition,
  validateMessageTone,
} from "@/modules/messages/customer-message-config";

function redirectWithMessage(params: Record<string, string | number>): never {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  redirect(`/admin/messages?${query.toString()}`);
}

export async function sendCustomerMessageAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "create");
  const audience = readFormString(formData, "audience") || "selected";
  const title = readFormString(formData, "title").trim();
  const body = readFormString(formData, "body").trim();
  const tone = validateMessageTone(readFormString(formData, "tone"));
  const selectedTenantIds = formData.getAll("tenantIds").map((value) => String(value)).filter(Boolean);

  if (!title || title.length < 2) redirectWithMessage({ error: "اكتب عنوان الرسالة." });
  if (!body || body.length < 2) redirectWithMessage({ error: "اكتب نص الرسالة." });
  if (audience !== "all" && selectedTenantIds.length === 0) {
    redirectWithMessage({ error: "اختر عميل واحد على الأقل أو اختر الإرسال للكل." });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      where: audience === "all"
        ? { deletedAt: null }
        : { id: { in: selectedTenantIds }, deletedAt: null },
      select: { id: true, ownerUserId: true, displayName: true },
      orderBy: { createdAt: "desc" },
    });

    if (tenants.length === 0) redirectWithMessage({ error: "لا يوجد عملاء مطابقين للإرسال." });

    await prisma.notificationLog.createMany({
      data: tenants.map((tenant) => ({
        type: tone,
        title,
        body,
        category: CUSTOMER_BROADCAST_CATEGORY,
        tenantId: tenant.id,
        userId: tenant.ownerUserId,
      })),
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id.startsWith("env-super-admin:") ? null : admin.id,
        action: "CUSTOMER_MESSAGE_SENT",
        entityType: "NotificationLog",
        metadata: {
          title,
          tone,
          audience,
          count: tenants.length,
          tenantIds: audience === "all" ? "ALL" : tenants.map((tenant) => tenant.id),
          adminEmail: admin.email,
        } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin/notifications");
    revalidatePath("/dashboard");
    redirectWithMessage({ sent: tenants.length });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "sendCustomerMessage", audience } });
    redirectWithMessage({ error: userError.message });
  }
}

export async function saveActivationTemplateAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const key = readFormString(formData, "key").trim() as ActivationTemplateKey;
  const title = readFormString(formData, "title").trim();
  const body = readFormString(formData, "body").trim();
  const tone = validateMessageTone(readFormString(formData, "tone"));
  const definition = getActivationTemplateDefinition(key);

  if (!definition) redirectWithMessage({ error: "نوع الرسالة غير صحيح." });
  if (!title || title.length < 2) redirectWithMessage({ error: "اكتب عنوان قالب الرسالة." });
  if (!body || body.length < 2) redirectWithMessage({ error: "اكتب نص قالب الرسالة." });

  try {
    await prisma.notificationLog.updateMany({
      where: { category: ACTIVATION_TEMPLATE_CATEGORY, title: key, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    await prisma.notificationLog.create({
      data: {
        type: tone,
        title: key,
        body: encodeActivationTemplatePayload({ title, body }),
        category: ACTIVATION_TEMPLATE_CATEGORY,
        userId: admin.id.startsWith("env-super-admin:") ? null : admin.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id.startsWith("env-super-admin:") ? null : admin.id,
        action: "ACTIVATION_MESSAGE_TEMPLATE_UPDATED",
        entityType: "NotificationLog",
        entityId: key,
        metadata: { key, title, body, tone, adminEmail: admin.email } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
    redirectWithMessage({ templateSaved: key });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveActivationTemplate", key } });
    redirectWithMessage({ error: userError.message });
  }
}
