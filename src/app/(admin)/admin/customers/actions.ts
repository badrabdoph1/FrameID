"use server";

import { Prisma, type PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { createCustomerDashboardImpersonation } from "@/modules/admin/customers/customer-impersonation";
import {
  createCustomerSubscriptionEditor,
  type CustomerSubscriptionDurationMode,
  type ManualPaymentMethod,
} from "@/modules/admin/customers/customer-subscription-editor";
import { createPrismaCustomerSubscriptionEditorRepository } from "@/modules/admin/customers/prisma-customer-subscription-editor-repository";
import { createCustomerSubscriptionVisibilityService } from "@/modules/admin/customers/customer-subscription-visibility";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { createPrismaLoginRepository } from "@/modules/auth/prisma-login-repository";
import { shouldUseSecureSessionCookie } from "@/modules/auth/request-cookie-security";
import { createSessionForUser } from "@/modules/auth/session-service";
import { addDays, applySubscriptionTimerToTenants, applyTrialTimerToTenants, lifecycleDurationOptions, type LifecycleDurationPreset } from "@/modules/lifecycle/customer-lifecycle";
import { createCustomerOutreachCampaign } from "@/modules/messages/customer-outreach-service";
import {
  clearTenantSubscriptionExperienceOverride,
  getSubscriptionExperienceDefaultsRecord,
  getTenantSubscriptionExperienceOverride,
  saveTenantSubscriptionExperienceOverride,
  subscriptionExperienceBucketDefinitions,
  type SubscriptionCardVisibilityPreference,
  type SubscriptionExperienceBucket,
} from "@/modules/subscription/subscription-experience";

function readFormInt(formData: FormData, key: string): number {
  const val = parseInt(readFormString(formData, key), 10);
  return Number.isNaN(val) ? 0 : val;
}

function parseDays(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(3650, Math.round(parsed)));
}

function parsePreset(value: string): LifecycleDurationPreset {
  return lifecycleDurationOptions.some((item) => item.value === value) ? value as LifecycleDurationPreset : "30";
}

function buildCustomersRedirect(params: Record<string, string | number>): string {
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  return `/admin/customers?${query.toString()}`;
}

async function getService() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  const repo = createCustomerAdminRepository(prisma);
  const service = createCustomerAdminService(repo);
  return { admin, service };
}

async function withErrorHandling<T>(action: string, fn: () => Promise<T>, context?: { userId?: string; tenantId?: string }): Promise<T> {
  try { return await fn(); }
  catch (error) { await processError(error, { userId: context?.userId, tenantId: context?.tenantId, metadata: { action } }); throw error; }
}

async function auditBulkAction(actorId: string, input: { action: string; tenantIds: string[]; metadata?: Prisma.InputJsonObject }) {
  await prisma.auditLog.create({
    data: { actorId, action: input.action, entityType: "Tenant", metadata: { tenantIds: input.tenantIds, count: input.tenantIds.length, ...(input.metadata ?? {}) } },
  }).catch(() => undefined);
}

export async function suspendCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  const reason = readFormString(formData, "reason");
  return withErrorHandling("suspendCustomer", () => service.suspendCustomer(id, { id: admin.id, name: admin.name }, reason));
}

export async function activateCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  return withErrorHandling("activateCustomer", () => service.activateCustomer(id, { id: admin.id, name: admin.name }));
}

export async function archiveCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  return withErrorHandling("archiveCustomer", () => service.archiveCustomer(id, { id: admin.id, name: admin.name }));
}

export async function deleteCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  return withErrorHandling("deleteCustomer", () => service.deleteCustomer(id, { id: admin.id, name: admin.name }));
}

export async function resetCustomerPasswordAction(formData: FormData) {
  const { admin, service } = await getService();
  const userId = readFormString(formData, "userId");
  const newPassword = readFormString(formData, "newPassword");
  return withErrorHandling("resetCustomerPassword", () => service.resetCustomerPassword(userId, newPassword, { id: admin.id, name: admin.name }));
}

export async function extendCustomerTrialAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const days = readFormInt(formData, "days");
  return withErrorHandling("extendCustomerTrial", () => service.extendTrial(tenantId, days, { id: admin.id, name: admin.name }), { userId: admin.id });
}

export async function activateCustomerSubscriptionAction(formData: FormData) {
  const { admin, service } = await getService();
  const subscriptionId = readFormString(formData, "subscriptionId");
  const tenantId = readFormString(formData, "tenantId");
  return withErrorHandling("activateCustomerSubscription", () => service.activateSubscription(subscriptionId, tenantId, { id: admin.id, name: admin.name }), { userId: admin.id, tenantId });
}

export async function cancelCustomerSubscriptionAction(formData: FormData) {
  const { admin, service } = await getService();
  const subscriptionId = readFormString(formData, "subscriptionId");
  const tenantId = readFormString(formData, "tenantId");
  return withErrorHandling("cancelCustomerSubscription", () => service.cancelSubscription(subscriptionId, tenantId, { id: admin.id, name: admin.name }), { userId: admin.id, tenantId });
}

export async function editCustomerSubscriptionAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");

  const tenantId = readFormString(formData, "tenantId");
  const subscriptionId = readFormString(formData, "subscriptionId") || undefined;
  const planId = readFormString(formData, "planId");
  const status = readFormString(formData, "status");
  const durationMode = readFormString(formData, "durationMode");
  const paymentMethod = readFormString(formData, "paymentMethod");
  const allowedStatuses = ["TRIAL", "ACTIVE", "EXPIRED", "PAST_DUE", "CANCELLED", "SUSPENDED"] as const;
  const allowedDurationModes: CustomerSubscriptionDurationMode[] = ["30", "90", "365", "forever", "custom-date", "adjust"];
  const allowedPaymentMethods: ManualPaymentMethod[] = ["INSTAPAY", "VODAFONE_CASH", "STRIPE", "PAYPAL"];

  if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) throw new Error("حالة الاشتراك غير صحيحة");
  if (!allowedDurationModes.includes(durationMode as CustomerSubscriptionDurationMode)) throw new Error("مدة الاشتراك غير صحيحة");
  if (paymentMethod && !allowedPaymentMethods.includes(paymentMethod as ManualPaymentMethod)) throw new Error("طريقة الدفع غير صحيحة");

  const paymentAmountValue = readFormString(formData, "paymentAmount");
  const paymentAmount = paymentAmountValue ? Number(paymentAmountValue) : undefined;
  const repository = createPrismaCustomerSubscriptionEditorRepository(prisma);
  const editor = createCustomerSubscriptionEditor({ repository });

  await withErrorHandling(
    "editCustomerSubscription",
    () => editor.edit({
      tenantId,
      subscriptionId,
      planId,
      status: status as (typeof allowedStatuses)[number],
      durationMode: durationMode as CustomerSubscriptionDurationMode,
      customEndDate: readFormString(formData, "customEndDate") || undefined,
      adjustmentDays: Number(readFormString(formData, "adjustmentDays") || 0),
      recordPayment: formData.get("recordPayment") === "true",
      paymentAmount,
      paymentMethod: paymentMethod ? paymentMethod as ManualPaymentMethod : undefined,
      paymentReference: readFormString(formData, "paymentReference") || undefined,
      note: readFormString(formData, "note") || undefined,
      actor: { id: admin.id, name: admin.name },
    }),
    { userId: admin.id, tenantId },
  );

  revalidatePath(`/admin/customers/${tenantId}`);
  revalidatePath("/admin/customers");
}

function createSubscriptionVisibilityActionService(
  client: PrismaClient | Prisma.TransactionClient,
) {
  return createCustomerSubscriptionVisibilityService({
    getDefaults: () => getSubscriptionExperienceDefaultsRecord(client),
    getOverride: (tenantId) =>
      getTenantSubscriptionExperienceOverride(client, tenantId),
    async persist(input) {
      if (input.override) {
        await saveTenantSubscriptionExperienceOverride(
          client,
          input.tenantId,
          input.override,
        );
      } else {
        await clearTenantSubscriptionExperienceOverride(
          client,
          input.tenantId,
        );
      }
      await client.auditLog.create({
        data: {
          actorId: input.audit.actorId,
          action: input.audit.action,
          entityType: "FeatureFlag",
          entityId: "platform.subscription.experience.override",
          metadata: input.audit.metadata as Prisma.InputJsonObject,
        },
      });
    },
  });
}

function revalidateSubscriptionVisibilityPaths(tenantId: string) {
  revalidatePath(`/admin/customers/${tenantId}`);
  revalidatePath("/admin/messages");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
}

export async function updateCustomerSubscriptionCardVisibilityAction(
  formData: FormData,
) {
  const admin = await requireAdminPermission("customers", "edit");
  const tenantId = readFormString(formData, "tenantId");
  const bucket = readFormString(formData, "bucket") as SubscriptionExperienceBucket;
  const preference = readFormString(
    formData,
    "preference",
  ) as SubscriptionCardVisibilityPreference;
  const validBucket = subscriptionExperienceBucketDefinitions.some(
    (item) => item.value === bucket,
  );
  if (!tenantId || !validBucket) throw new Error("حالة كارت الاشتراك غير صحيحة");
  if (!["inherit", "show", "hide"].includes(preference)) {
    throw new Error("اختيار ظهور الكارت غير صحيح");
  }

  await withErrorHandling(
    "updateCustomerSubscriptionCardVisibility",
    () => prisma.$transaction(
      (transaction) =>
        createSubscriptionVisibilityActionService(transaction).updateVisibility({
          tenantId,
          bucket,
          preference,
          actor: { id: admin.id, name: admin.name },
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
    { userId: admin.id, tenantId },
  );
  revalidateSubscriptionVisibilityPaths(tenantId);
}

export async function clearCustomerSubscriptionExperienceOverridesAction(
  formData: FormData,
) {
  const admin = await requireAdminPermission("customers", "edit");
  const tenantId = readFormString(formData, "tenantId");
  if (!tenantId) throw new Error("العميل غير محدد");

  await withErrorHandling(
    "clearCustomerSubscriptionExperienceOverrides",
    () => prisma.$transaction(
      (transaction) =>
        createSubscriptionVisibilityActionService(transaction).clearAll({
          tenantId,
          actor: { id: admin.id, name: admin.name },
        }),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
    { userId: admin.id, tenantId },
  );
  revalidateSubscriptionVisibilityPaths(tenantId);
}

export async function publishSiteAction(formData: FormData) {
  const { admin, service } = await getService();
  const siteId = readFormString(formData, "siteId");
  const tenantId = readFormString(formData, "tenantId");
  const publish = formData.get("publish") === "true";
  return withErrorHandling("publishSite", () => service.publishSite(siteId, tenantId, { id: admin.id, name: admin.name }, publish), { userId: admin.id, tenantId });
}

export async function suspendSiteAction(formData: FormData) {
  const { admin, service } = await getService();
  const siteId = readFormString(formData, "siteId");
  const tenantId = readFormString(formData, "tenantId");
  const suspended = formData.get("suspended") === "true";
  return withErrorHandling("suspendSite", () => service.suspendSite(siteId, tenantId, { id: admin.id, name: admin.name }, suspended), { userId: admin.id, tenantId });
}

export async function revokeSessionAction(formData: FormData) {
  const { admin, service } = await getService();
  const sessionId = readFormString(formData, "sessionId");
  const tenantId = readFormString(formData, "tenantId");
  return withErrorHandling("revokeSession", () => service.revokeSession(sessionId, tenantId, { id: admin.id, name: admin.name }), { userId: admin.id, tenantId });
}

export async function createAdminNoteAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const body = readFormString(formData, "body");
  return withErrorHandling("createAdminNote", () => service.createAdminNote(tenantId, body, { id: admin.id, name: admin.name }), { userId: admin.id, tenantId });
}

export async function deleteAdminNoteAction(formData: FormData) {
  const { admin, service } = await getService();
  const noteId = readFormString(formData, "noteId");
  return withErrorHandling("deleteAdminNote", () => service.deleteAdminNote(noteId, { id: admin.id, name: admin.name }));
}

export async function sendNotificationAction(formData: FormData) {
  const admin = await requireAdminPermission("messages", "edit");
  const tenantId = readFormString(formData, "tenantId");
  const notificationType = readFormString(formData, "notificationType");
  const title = readFormString(formData, "title");
  const body = readFormString(formData, "body");
  const tone = notificationType === "error" ? "danger" : notificationType;
  await withErrorHandling("sendNotification", () => createCustomerOutreachCampaign(prisma, {
    title,
    body,
    tone,
    audienceMode: "EXPLICIT",
    tenantIds: [tenantId],
    filters: {},
  }, admin), { userId: admin.id, tenantId });
  revalidatePath("/admin/messages/customer-outreach");
  revalidatePath("/dashboard");
}

export async function impersonateCustomerAction(formData: FormData) {
  const admin = await requireAdminPermission("customers", "edit");
  const tenantId = readFormString(formData, "tenantId");
  if (!tenantId) redirect("/admin/customers?error=missing-tenant");

  let result: Awaited<ReturnType<typeof createCustomerDashboardImpersonation>>;
  try {
    const cookieSecure = await shouldUseSecureSessionCookie();
    const sessionRepository = createPrismaLoginRepository(prisma);
    const auditRepository = createCustomerAdminRepository(prisma);

    result = await createCustomerDashboardImpersonation({
      tenantId,
      actor: { id: admin.id, name: admin.name },
      createSession: ({ userId }) => createSessionForUser({
        repository: sessionRepository,
        userId,
        cookieSecure,
      }),
      repository: {
        async findTenantForDashboardImpersonation(id) {
          const tenant = await prisma.tenant.findUnique({
            where: { id, deletedAt: null },
            select: {
              id: true,
              displayName: true,
              ownerUserId: true,
              sites: {
                where: { deletedAt: null },
                orderBy: { createdAt: "asc" },
                select: { id: true },
                take: 1,
              },
            },
          });

          if (!tenant) return null;
          return {
            id: tenant.id,
            displayName: tenant.displayName,
            ownerUserId: tenant.ownerUserId,
            firstSiteId: tenant.sites[0]?.id ?? null,
          };
        },
        async createImpersonationSession(input) {
          await prisma.impersonationSession.create({
            data: {
              adminId: input.adminId,
              tenantId: input.tenantId,
              expiresAt: input.expiresAt,
            },
          });
        },
        async createAuditLog(actorId, id, action, entityType, entityId, metadata) {
          await auditRepository.createAuditLog(actorId, id, action, entityType, entityId, metadata);
        },
      },
    });
  } catch (error) {
    const { userError } = await processError(error, { userId: admin.id, tenantId, metadata: { action: "impersonateCustomer" } });
    redirect(`/admin/customers?error=${encodeURIComponent(userError.message)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(result.cookie.name, result.cookie.value, result.cookie.options);
  redirect(result.redirectTo);
}

export async function bulkCustomerLifecycleAction(formData: FormData) {
  const action = readFormString(formData, "bulkAction");
  const admin = action === "notify"
    ? await requireAdminPermission("messages", "edit")
    : await getCurrentAdmin();
  if (!admin) redirect(buildCustomersRedirect({ bulkError: "غير مصرح." }));

  const tenantIds = formData.getAll("tenantIds").map(String).filter(Boolean);
  const days = parseDays(readFormString(formData, "days"), 30);
  const preset = parsePreset(readFormString(formData, "durationPreset"));
  const customDays = parseDays(readFormString(formData, "customDays"), 30);
  const title = readFormString(formData, "messageTitle").trim() || "رسالة من إدارة FrameID";
  const body = readFormString(formData, "messageBody").trim();

  if (tenantIds.length === 0) redirect(buildCustomersRedirect({ bulkError: "اختر عميل واحد على الأقل." }));

  let doneCount = 0;
  try {
    if (action === "extend-trial") {
      doneCount = await applyTrialTimerToTenants(prisma, tenantIds, days);
    } else if (action === "extend-subscription" || action === "change-duration") {
      doneCount = await applySubscriptionTimerToTenants(prisma, tenantIds, preset, customDays);
    } else if (action === "activate") {
      const now = new Date();
      const end = preset === "forever" ? new Date("2099-12-31") : addDays(now, preset === "custom" ? customDays : Number(preset === "keep" ? "30" : preset));
      const subscriptions = await prisma.subscription.findMany({ where: { tenantId: { in: tenantIds } }, select: { id: true, tenantId: true } });
      for (const subscription of subscriptions) await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: end, expiresAt: end } });
      await prisma.tenant.updateMany({ where: { id: { in: tenantIds }, deletedAt: null }, data: { status: "ACTIVE", gracePeriodEndsAt: null } });
      await prisma.site.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "PUBLISHED", isPublished: true } });
      doneCount = tenantIds.length;
      await auditBulkAction(admin.id, { action: "CUSTOMERS_BULK_ACTIVATED", tenantIds, metadata: { preset, customDays, endAt: end?.toISOString() ?? null } as Prisma.InputJsonObject });
    } else if (action === "suspend") {
      await prisma.tenant.updateMany({ where: { id: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED" } });
      await prisma.subscription.updateMany({ where: { tenantId: { in: tenantIds } }, data: { status: "SUSPENDED" } });
      await prisma.site.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED", isPublished: false } });
      doneCount = tenantIds.length;
      await auditBulkAction(admin.id, { action: "CUSTOMERS_BULK_SUSPENDED", tenantIds });
    } else if (action === "archive" || action === "delete") {
      const now = new Date();
      await prisma.tenant.updateMany({ where: { id: { in: tenantIds }, deletedAt: null }, data: { deletedAt: now, status: "SUSPENDED" } });
      await prisma.site.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED", isPublished: false, deletedAt: now } });
      doneCount = tenantIds.length;
      await auditBulkAction(admin.id, { action: "CUSTOMERS_BULK_ARCHIVED", tenantIds });
    } else if (action === "notify") {
      if (!body) redirect(buildCustomersRedirect({ bulkError: "اكتب نص الرسالة أولًا." }));
      const result = await createCustomerOutreachCampaign(prisma, {
        title,
        body,
        tone: "info",
        audienceMode: "EXPLICIT",
        tenantIds,
        filters: {},
      }, admin);
      doneCount = result.recipientCount;
    } else if (action === "email") {
      throw new Error("إرسال البريد الجماعي غير مفعّل من هذه الشاشة. استخدم قسم تسليم البريد.");
    } else {
      redirect(buildCustomersRedirect({ bulkError: "اختر عملية صحيحة." }));
    }
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "bulkCustomerLifecycle", bulkAction: action } });
    redirect(buildCustomersRedirect({ bulkError: userError.message }));
  }

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/messages");
  revalidatePath("/dashboard");
  redirect(buildCustomersRedirect({ bulkDone: doneCount }));
}
