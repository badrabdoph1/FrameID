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
import {
  applySubscriptionTimerToTenants,
  applyTrialTimerToTenants,
  defaultLifecycleTimerSettings,
  lifecycleDurationOptions,
  normalizeLifecycleTimerSettings,
  saveLifecycleTimerSettings,
  type LifecycleDurationPreset,
} from "@/modules/lifecycle/customer-lifecycle";

function redirectWithMessage(params: Record<string, string | number>): never {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  redirect(`/admin/messages?${query.toString()}`);
}

function parseBool(value: string) {
  return value === "on" || value === "true" || value === "1";
}

function parseDays(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(3650, Math.round(parsed)));
}

function parsePreset(value: string): LifecycleDurationPreset {
  return lifecycleDurationOptions.some((item) => item.value === value) ? value as LifecycleDurationPreset : "30";
}

export async function saveLifecycleTimersAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const existing = await prisma.featureFlag.findFirst({
    where: { key: "platform.lifecycle.timers", scope: "PLATFORM", tenantId: null, siteId: null },
    select: { value: true },
  });
  const current = normalizeLifecycleTimerSettings(existing?.value);
  const settings = {
    trial: {
      enabled: parseBool(readFormString(formData, "trialEnabled")),
      useDefault: parseBool(readFormString(formData, "trialUseDefault")),
      defaultDays: parseDays(readFormString(formData, "trialDays"), current.trial.defaultDays || defaultLifecycleTimerSettings.trial.defaultDays),
    },
    subscription: {
      enabled: parseBool(readFormString(formData, "subscriptionEnabled")),
      defaultPreset: parsePreset(readFormString(formData, "subscriptionPreset") || current.subscription.defaultPreset),
      customDays: parseDays(readFormString(formData, "subscriptionCustomDays"), current.subscription.customDays || 30),
    },
  };

  try {
    await saveLifecycleTimerSettings(prisma, settings);
    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id.startsWith("env-super-admin:") ? null : admin.id,
        action: "LIFECYCLE_TIMERS_UPDATED",
        entityType: "FeatureFlag",
        entityId: "platform.lifecycle.timers",
        metadata: { settings, adminEmail: admin.email } as Prisma.InputJsonObject,
      },
    });
    revalidatePath("/admin/messages");
    redirectWithMessage({ timerSaved: "1" });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveLifecycleTimers" } });
    redirectWithMessage({ error: userError.message });
  }
}

export async function applyLifecycleTimerAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const timerType = readFormString(formData, "timerType");
  const audience = readFormString(formData, "audience") || "selected";
  const selectedTenantIds = formData.getAll("tenantIds").map(String).filter(Boolean);

  try {
    let tenants: Array<{ id: string }> = [];

    if (timerType === "trial") {
      const days = parseDays(readFormString(formData, "trialDays"), defaultLifecycleTimerSettings.trial.defaultDays);
      tenants = await prisma.tenant.findMany({
        where: audience === "all" ? { deletedAt: null, status: "TRIAL" } : { id: { in: selectedTenantIds }, deletedAt: null, status: "TRIAL" },
        select: { id: true },
      });
      if (tenants.length === 0) redirectWithMessage({ error: "لا يوجد عملاء تجريبيون مطابقون." });
      const count = await applyTrialTimerToTenants(prisma, tenants.map((tenant) => tenant.id), days, admin.id.startsWith("env-super-admin:") ? null : admin.id);
      revalidatePath("/admin/messages");
      revalidatePath("/admin/customers");
      revalidatePath("/dashboard");
      redirectWithMessage({ timerApplied: count });
    }

    if (timerType === "subscription") {
      const preset = parsePreset(readFormString(formData, "subscriptionPreset"));
      const customDays = parseDays(readFormString(formData, "subscriptionCustomDays"), 30);
      tenants = await prisma.tenant.findMany({
        where: audience === "all"
          ? { deletedAt: null, status: "ACTIVE", subscriptions: { some: { deletedAt: null, status: "ACTIVE" } } }
          : { id: { in: selectedTenantIds }, deletedAt: null, status: "ACTIVE", subscriptions: { some: { deletedAt: null, status: "ACTIVE" } } },
        select: { id: true },
      });
      if (tenants.length === 0) redirectWithMessage({ error: "لا يوجد مشتركين مطابقين." });
      const count = await applySubscriptionTimerToTenants(prisma, tenants.map((tenant) => tenant.id), preset, customDays, admin.id.startsWith("env-super-admin:") ? null : admin.id);
      revalidatePath("/admin/messages");
      revalidatePath("/admin/customers");
      revalidatePath("/dashboard");
      redirectWithMessage({ timerApplied: count });
    }

    redirectWithMessage({ error: "نوع المؤقت غير صحيح." });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "applyLifecycleTimer", timerType } });
    redirectWithMessage({ error: userError.message });
  }
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
  if (audience !== "all" && selectedTenantIds.length === 0) redirectWithMessage({ error: "اختر عميل واحد على الأقل أو اختر الإرسال للكل." });

  try {
    const tenants = await prisma.tenant.findMany({
      where: audience === "all" ? { deletedAt: null } : { id: { in: selectedTenantIds }, deletedAt: null },
      select: { id: true, ownerUserId: true, displayName: true },
      orderBy: { createdAt: "desc" },
    });

    if (tenants.length === 0) redirectWithMessage({ error: "لا يوجد عملاء مطابقين للإرسال." });

    await prisma.notificationLog.createMany({
      data: tenants.map((tenant) => ({ type: tone, title, body, category: CUSTOMER_BROADCAST_CATEGORY, tenantId: tenant.id, userId: tenant.ownerUserId })),
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id.startsWith("env-super-admin:") ? null : admin.id,
        action: "CUSTOMER_MESSAGE_SENT",
        entityType: "NotificationLog",
        metadata: { title, tone, audience, count: tenants.length, tenantIds: audience === "all" ? "ALL" : tenants.map((tenant) => tenant.id), adminEmail: admin.email } as Prisma.InputJsonObject,
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
    await prisma.notificationLog.updateMany({ where: { category: ACTIVATION_TEMPLATE_CATEGORY, title: key, deletedAt: null }, data: { deletedAt: new Date() } });
    await prisma.notificationLog.create({ data: { type: tone, title: key, body: encodeActivationTemplatePayload({ title, body }), category: ACTIVATION_TEMPLATE_CATEGORY, userId: admin.id.startsWith("env-super-admin:") ? null : admin.id } });
    await prisma.auditLog.create({ data: { actorUserId: admin.id.startsWith("env-super-admin:") ? null : admin.id, action: "ACTIVATION_MESSAGE_TEMPLATE_UPDATED", entityType: "NotificationLog", entityId: key, metadata: { key, title, body, tone, adminEmail: admin.email } as Prisma.InputJsonObject } });
    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
    redirectWithMessage({ templateSaved: key });
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveActivationTemplate", key } });
    redirectWithMessage({ error: userError.message });
  }
}
