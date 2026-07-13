"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { validateMessageTone } from "@/modules/messages/customer-message-config";
import {
  applyDefaultTrialDurationFromRegistration,
  grantFreshTrialToTenants,
  syncCustomerLifecycle,
} from "@/modules/lifecycle/customer-lifecycle";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";
import {
  getSubscriptionExperienceDefaults,
  getTenantSubscriptionExperienceOverride,
  normalizeSubscriptionExperienceOverride,
  saveSubscriptionExperienceDefaults,
  saveTenantSubscriptionExperienceOverride,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionExperienceActionKind,
  type SubscriptionExperienceBucket,
  type SubscriptionExperienceDefaults,
  type SubscriptionExperienceOverride,
} from "@/modules/subscription/subscription-experience";

function redirectWithMessage(params: Record<string, string | number>) {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
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

function parseBucket(value: string): SubscriptionExperienceBucket {
  return subscriptionExperienceBucketDefinitions.some(
    (item) => item.value === value,
  )
    ? (value as SubscriptionExperienceBucket)
    : "trial";
}

function parseActionKind(value: string): SubscriptionExperienceActionKind {
  return [
    "activate-default",
    "billing-page",
    "whatsapp",
    "support",
    "custom-link",
    "hidden",
  ].includes(value)
    ? (value as SubscriptionExperienceActionKind)
    : "billing-page";
}

function adminActorMetadata(admin: { id: string; email: string }) {
  return { adminActorId: admin.id, adminEmail: admin.email };
}

function assertMessageFields(
  enabled: boolean,
  title: string,
  description: string,
) {
  if (!enabled) return;
  if (title.trim().length < 2) throw new Error("عنوان الرسالة مطلوب.");
  if (description.trim().length < 2) throw new Error("وصف الرسالة مطلوب.");
}

function buildBucketConfig(
  formData: FormData,
  bucket: SubscriptionExperienceBucket,
  current: SubscriptionExperienceDefaults[SubscriptionExperienceBucket],
) {
  const messageEnabled = parseBool(readFormString(formData, `${bucket}MessageEnabled`));
  const messageTitle =
    readFormString(formData, `${bucket}MessageTitle`).trim() ||
    current.message.title;
  const messageDescription =
    readFormString(formData, `${bucket}MessageDescription`).trim() ||
    current.message.description;
  const messageTone = validateMessageTone(
    readFormString(formData, `${bucket}MessageTone`) || current.message.tone,
  );
  const actionKind = parseActionKind(
    readFormString(formData, `${bucket}ActionKind`) || current.action.kind,
  );
  const actionLabel =
    actionKind === "hidden"
      ? ""
      : readFormString(formData, `${bucket}ActionLabel`).trim() ||
        current.action.label;
  const actionHref =
    actionKind === "custom-link"
      ? readFormString(formData, `${bucket}ActionHref`).trim()
      : null;

  assertMessageFields(messageEnabled, messageTitle, messageDescription);
  if (actionKind === "custom-link" && !actionHref) {
    throw new Error("الرابط المخصص مطلوب عند اختيار زر برابط مخصص.");
  }

  return {
    message: {
      enabled: messageEnabled,
      title: messageTitle,
      description: messageDescription,
      tone: messageTone,
    },
    action: {
      kind: actionKind,
      label: actionLabel,
      href: actionKind === "custom-link" ? actionHref : null,
    },
    timer: current.timer
      ? {
          enabled: parseBool(readFormString(formData, `${bucket}TimerEnabled`)),
        }
      : undefined,
  };
}

function buildOverrideBucketConfig(
  formData: FormData,
  bucket: SubscriptionExperienceBucket,
) {
  const messageEnabled = parseBool(readFormString(formData, "messageEnabled"));
  const messageTitle = readFormString(formData, "messageTitle").trim();
  const messageDescription = readFormString(formData, "messageDescription").trim();
  const messageTone = validateMessageTone(readFormString(formData, "messageTone"));
  const actionKind = parseActionKind(readFormString(formData, "actionKind"));
  const actionLabel =
    actionKind === "hidden" ? "" : readFormString(formData, "actionLabel").trim();
  const actionHref =
    actionKind === "custom-link"
      ? readFormString(formData, "actionHref").trim()
      : null;

  assertMessageFields(messageEnabled, messageTitle, messageDescription);
  if (actionKind === "custom-link" && !actionHref) {
    throw new Error("الرابط المخصص مطلوب عند اختيار زر برابط مخصص.");
  }

  return {
    [bucket]: {
      message: {
        enabled: messageEnabled,
        title: messageTitle,
        description: messageDescription,
        tone: messageTone,
      },
      action: {
        kind: actionKind,
        label: actionLabel,
        href: actionHref,
      },
      timer:
        bucket === "trial"
          ? {
              enabled: parseBool(readFormString(formData, "timerEnabled")),
            }
          : undefined,
    },
  } satisfies SubscriptionExperienceOverride;
}

export async function saveSubscriptionExperienceDefaultsAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");

  try {
    const current = await getSubscriptionExperienceDefaults(prisma);
    const defaults = {
      trial: buildBucketConfig(formData, "trial", current.trial),
      active: buildBucketConfig(formData, "active", current.active),
      pendingReview: buildBucketConfig(
        formData,
        "pendingReview",
        current.pendingReview,
      ),
      rejected: buildBucketConfig(formData, "rejected", current.rejected),
      expired: buildBucketConfig(formData, "expired", current.expired),
      trialPolicy: {
        defaultDays: parseDays(
          readFormString(formData, "trialPolicyDefaultDays"),
          current.trialPolicy.defaultDays,
        ),
      },
    } satisfies SubscriptionExperienceDefaults;

    await saveSubscriptionExperienceDefaults(prisma, defaults);

    let appliedCount = 0;
    if (parseBool(readFormString(formData, "applyTrialDefaultsToCurrent"))) {
      appliedCount = await applyDefaultTrialDurationFromRegistration(
        prisma,
        defaults.trialPolicy.defaultDays,
      );
      await syncCustomerLifecycle(prisma);
    }

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "SUBSCRIPTION_EXPERIENCE_DEFAULTS_UPDATED",
        entityType: "FeatureFlag",
        entityId: "platform.subscription.experience.defaults",
        metadata: {
          defaults,
          appliedCount,
          ...adminActorMetadata(admin),
        } as Prisma.InputJsonObject,
      },
    });

    await syncPlatformConfigurationToGitHub({
      actor: admin,
      reason: "تحديث إعدادات رسائل الاشتراك والتفعيل",
    });

    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/customers");
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: {
        action: "saveSubscriptionExperienceDefaults",
        ...adminActorMetadata(admin),
      },
    });
    redirectWithMessage({ error: userError.message });
  }

  redirectWithMessage({ defaultsSaved: 1 });
}

export async function saveSubscriptionExperienceOverrideAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const tenantIds = formData.getAll("tenantIds").map(String).filter(Boolean);
  const bucket = parseBucket(readFormString(formData, "bucket"));

  if (tenantIds.length === 0) redirectWithMessage({ error: "اختر عميلًا واحدًا على الأقل." });

  try {
    const overridePatch = buildOverrideBucketConfig(formData, bucket);

    for (const tenantId of tenantIds) {
      const current = (await getTenantSubscriptionExperienceOverride(
        prisma,
        tenantId,
      )) ?? {};

      await saveTenantSubscriptionExperienceOverride(prisma, tenantId, {
        ...current,
        ...overridePatch,
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "SUBSCRIPTION_EXPERIENCE_OVERRIDE_SAVED",
        entityType: "FeatureFlag",
        metadata: {
          tenantIds,
          bucket,
          ...adminActorMetadata(admin),
        } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/customers");
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: {
        action: "saveSubscriptionExperienceOverride",
        bucket,
        tenantIds,
        ...adminActorMetadata(admin),
      },
    });
    redirectWithMessage({ error: userError.message });
  }

  redirectWithMessage({ overrideSaved: tenantIds.length });
}

export async function clearSubscriptionExperienceOverrideAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const tenantIds = formData.getAll("tenantIds").map(String).filter(Boolean);
  const bucket = parseBucket(readFormString(formData, "bucket"));

  if (tenantIds.length === 0) redirectWithMessage({ error: "اختر عميلًا واحدًا على الأقل." });

  try {
    for (const tenantId of tenantIds) {
      const current = await getTenantSubscriptionExperienceOverride(prisma, tenantId);
      if (!current) continue;
      const next = { ...current };
      delete next[bucket];
      await saveTenantSubscriptionExperienceOverride(
        prisma,
        tenantId,
        normalizeSubscriptionExperienceOverride(next),
      );
    }

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "SUBSCRIPTION_EXPERIENCE_OVERRIDE_CLEARED",
        entityType: "FeatureFlag",
        metadata: {
          tenantIds,
          bucket,
          ...adminActorMetadata(admin),
        } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");
    revalidatePath("/admin/customers");
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: {
        action: "clearSubscriptionExperienceOverride",
        bucket,
        tenantIds,
        ...adminActorMetadata(admin),
      },
    });
    redirectWithMessage({ error: userError.message });
  }

  redirectWithMessage({ overrideCleared: tenantIds.length });
}

export async function grantFreshTrialFromMessagesAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const tenantIds = formData.getAll("tenantIds").map(String).filter(Boolean);
  const trialDays = parseDays(readFormString(formData, "trialDays"), 3);

  if (tenantIds.length === 0) redirectWithMessage({ error: "اختر عميلًا واحدًا على الأقل." });

  try {
    const appliedCount = await grantFreshTrialToTenants(prisma, tenantIds, trialDays);

    await prisma.auditLog.create({
      data: {
        actorId: null,
        action: "TRIAL_FRESH_GRANT_FROM_MESSAGES",
        entityType: "Tenant",
        metadata: {
          tenantIds,
          trialDays,
          appliedCount,
          ...adminActorMetadata(admin),
        } as Prisma.InputJsonObject,
      },
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin/customers");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/billing");
    redirectWithMessage({ freshTrialGranted: appliedCount });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: {
        action: "grantFreshTrialFromMessages",
        tenantIds,
        trialDays,
        ...adminActorMetadata(admin),
      },
    });
    redirectWithMessage({ error: userError.message });
  }
}
