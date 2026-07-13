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
  applyDefaultTrialDurationFromRegistration,
  applySubscriptionTimerToTenants,
  applyTrialTimerToTenants,
  defaultLifecycleTimerSettings,
  lifecycleDurationOptions,
  normalizeLifecycleTimerSettings,
  saveLifecycleTimerSettings,
  syncCustomerLifecycle,
  type LifecycleDurationPreset,
} from "@/modules/lifecycle/customer-lifecycle";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

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
  return lifecycleDurationOptions.some((item) => item.value === value) ? value as LifecycleDurationPreset : "keep";
}

function adminActorMetadata(admin: { id: string; email: string }) {
  return { adminActorId: admin.id, adminEmail: admin.email };
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

  let defaultTrialApplied = 0;

  try {
    await saveLifecycleTimerSettings(prisma, settings);

    if (settings.trial.useDefault) {
      defaultTrialApplied = await applyDefaultTrialDurationFromRegistration(prisma, settings.trial.defaultDays);
      await syncCustomerLifecycle(prisma);
    }

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "LIFECYCLE_TIMERS_UPDATED",
        entityType: "FeatureFlag",
        entityId: "platform.lifecycle.timers",
        metadata: { settings, defaultTrialApplied, ...adminActorMetadata(admin) } as Prisma.InputJsonObject,
      },
    });
    await syncPlatformConfigurationToGitHub({ actor: admin, reason: "تعديل مؤقتات المنصة" });
    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
    revalidatePath("/admin/customers");
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "saveLifecycleTimers", ...adminActorMetadata(admin) } });
    redirectWithMessage({ error: userError.message });
  }

  redirectWithMessage({ timerSaved: defaultTrialApplied || "1" });
}

export async function applyLifecycleTimerAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const timerType = readFormString(formData, "timerType");
  const audience = readFormString(formData, "audience") || "selected";
  const timerMode = readFormString(formData, "timerMode") || "keep";
  const selectedTenantIds = formData.getAll("tenantIds").map(String).filter(Boolean);
  let appliedCount = 0;

  try {
    if (audience !== "all" && selectedTenantIds.length === 0) {
      throw new Error("اختر عميل واحد على الأقل أو اختر تطبيق على الكل.");
    }

    if (timerType === "trial") {
      const tenants = await prisma.tenant.findMany({
        where: audience === "all" ? { deletedAt: null, status: "TRIAL" } : { id: { in: selectedTenantIds }, deletedAt: null, status: "TRIAL" },
        select: { id: true },
      });
      if (tenants.length === 0) throw new Error("لا يوجد عملاء تجريبيون مطابقون.");
      const days = timerMode === "days" ? parseDays(readFormString(formData, "trialDays"), defaultLifecycleTimerSettings.trial.defaultDays) : "keep";
      appliedCount = await applyTrialTimerToTenants(prisma, tenants.map((tenant) => tenant.id), days);
      await syncCustomerLifecycle(prisma);
    } else if (timerType === "subscription") {
      const tenants = await prisma.tenant.findMany({
        where: audience === "all"
          ? { deletedAt: null, status: "ACTIVE", subscriptions: { some: { status: "ACTIVE" } } }
          : { id: { in: selectedTenantIds }, deletedAt: null, status: "ACTIVE", subscriptions: { some: { status: "ACTIVE" } } },
        select: { id: true },
      });
      if (tenants.length === 0) throw new Error("لا يوجد مشتركين مطابقين.");
      const preset = timerMode === "keep" ? "keep" : parsePreset(readFormString(formData, "subscriptionPreset"));
      const customDays = parseDays(readFormString(formData, "subscriptionCustomDays"), 30);
      appliedCount = await applySubscriptionTimerToTenants(prisma, tenants.map((tenant) => tenant.id), preset, customDays);
    } else {
      throw new Error("نوع المؤقت غير صحيح.");
    }

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: timerType === "trial" ? "TRIAL_TIMER_APPLIED_FROM_MESSAGES" : "SUBSCRIPTION_TIMER_APPLIED_FROM_MESSAGES",
        entityType: "Tenant",
        metadata: { timerType, audience, timerMode, selectedTenantIds, appliedCount, ...adminActorMetadata(admin) } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin/customers");
    revalidatePath("/dashboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل تطبيق المؤقت.";
    await processError(error, { metadata: { action: "applyLifecycleTimer", timerType, ...adminActorMetadata(admin) } }).catch(() => undefined);
    redirectWithMessage({ error: message });
  }

  redirectWithMessage({ timerApplied: appliedCount });
}

export async function sendCustomerMessageAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "create");
  const audience = readFormString(formData, "audience") || "selected";
  const title = readFormString(formData, "title").trim();
  const body = readFormString(formData, "body").trim();
  const tone = validateMessageTone(readFormString(formData, "tone"));
  const selectedTenantIds = formData.getAll("tenantIds").map((value) => String(value)).filter(Boolean);
  let sentCount = 0;

  if (!title || title.length < 2) redirectWithMessage({ error: "اكتب عنوان الرسالة." });
  if (!body || body.length < 2) redirectWithMessage({ error: "اكتب نص الرسالة." });
  if (audience !== "all" && selectedTenantIds.length === 0) redirectWithMessage({ error: "اختر عميل واحد على الأقل أو اختر الإرسال للكل." });

  try {
    const tenants = await prisma.tenant.findMany({
      where: audience === "all" ? { deletedAt: null } : { id: { in: selectedTenantIds }, deletedAt: null },
      select: { id: true, displayName: true },
      orderBy: { createdAt: "desc" },
    });

    if (tenants.length === 0) throw new Error("لا يوجد عملاء مطابقين للإرسال.");

    await prisma.notificationLog.createMany({
      data: tenants.map((tenant) => ({ type: tone, title, body, category: CUSTOMER_BROADCAST_CATEGORY, tenantId: tenant.id })),
    });
    sentCount = tenants.length;

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "CUSTOMER_MESSAGE_SENT",
        entityType: "NotificationLog",
        metadata: { title, tone, audience, count: tenants.length, tenantIds: audience === "all" ? "ALL" : tenants.map((tenant) => tenant.id), ...adminActorMetadata(admin) } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin/notifications");
    revalidatePath("/dashboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل إرسال الرسالة.";
    await processError(error, { metadata: { action: "sendCustomerMessage", audience, ...adminActorMetadata(admin) } }).catch(() => undefined);
    redirectWithMessage({ error: message });
  }

  redirectWithMessage({ sent: sentCount });
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
    await prisma.notificationLog.create({ data: { type: tone, title: key, body: encodeActivationTemplatePayload({ title, body }), category: ACTIVATION_TEMPLATE_CATEGORY } });
    await prisma.auditLog.create({ data: { actorId: null, action: "ACTIVATION_MESSAGE_TEMPLATE_UPDATED", entityType: "NotificationLog", entityId: key, metadata: { key, title, body, tone, ...adminActorMetadata(admin) } as Prisma.InputJsonObject } });
    await syncPlatformConfigurationToGitHub({ actor: admin, reason: "تعديل رسالة منصة" });
    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
  } catch (error) {
    const message = error instanceof Error ? error.message : "فشل حفظ رسالة التفعيل.";
    await processError(error, { metadata: { action: "saveActivationTemplate", key, ...adminActorMetadata(admin) } }).catch(() => undefined);
    redirectWithMessage({ error: message });
  }

  redirectWithMessage({ templateSaved: key });
}
