"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { addDays, applySubscriptionTimerToTenants, applyTrialTimerToTenants, lifecycleDurationOptions, type LifecycleDurationPreset } from "@/modules/lifecycle/customer-lifecycle";

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

async function auditBulkAction(input: { action: string; tenantIds: string[]; metadata?: Prisma.InputJsonObject }) {
  await prisma.auditLog.create({
    data: { actorId: null, action: input.action, entityType: "Tenant", metadata: { tenantIds: input.tenantIds, count: input.tenantIds.length, ...(input.metadata ?? {}) } },
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
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const notificationType = readFormString(formData, "notificationType");
  const title = readFormString(formData, "title");
  const body = readFormString(formData, "body");
  return withErrorHandling("sendNotification", () => service.sendNotification(tenantId, notificationType, title, body, { id: admin.id, name: admin.name }), { userId: admin.id, tenantId });
}

export async function impersonateCustomerAction(formData: FormData) {
  const { admin } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const repo = createCustomerAdminRepository(prisma);
  await repo.createAuditLog(admin.id, tenantId, "ADMIN_IMPERSONATED", "Tenant", tenantId, { adminName: admin.name });
}

export async function bulkCustomerLifecycleAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(buildCustomersRedirect({ bulkError: "غير مصرح." }));

  const action = readFormString(formData, "bulkAction");
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
      const subscriptions = await prisma.subscription.findMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, select: { id: true, tenantId: true } });
      for (const subscription of subscriptions) await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", currentPeriodStart: now, currentPeriodEnd: end, expiresAt: end } });
      await prisma.tenant.updateMany({ where: { id: { in: tenantIds }, deletedAt: null }, data: { status: "ACTIVE", gracePeriodEndsAt: null } });
      await prisma.site.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "PUBLISHED", isPublished: true } });
      doneCount = tenantIds.length;
      await auditBulkAction({ action: "CUSTOMERS_BULK_ACTIVATED", tenantIds, metadata: { preset, customDays, endAt: end?.toISOString() ?? null } as Prisma.InputJsonObject });
    } else if (action === "suspend") {
      await prisma.tenant.updateMany({ where: { id: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED" } });
      await prisma.subscription.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED" } });
      await prisma.site.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED", isPublished: false } });
      doneCount = tenantIds.length;
      await auditBulkAction({ action: "CUSTOMERS_BULK_SUSPENDED", tenantIds });
    } else if (action === "archive" || action === "delete") {
      const now = new Date();
      await prisma.tenant.updateMany({ where: { id: { in: tenantIds }, deletedAt: null }, data: { deletedAt: now, status: "SUSPENDED" } });
      await prisma.site.updateMany({ where: { tenantId: { in: tenantIds }, deletedAt: null }, data: { status: "SUSPENDED", isPublished: false, deletedAt: now } });
      doneCount = tenantIds.length;
      await auditBulkAction({ action: "CUSTOMERS_BULK_ARCHIVED", tenantIds });
    } else if (action === "notify" || action === "email") {
      if (!body) redirect(buildCustomersRedirect({ bulkError: "اكتب نص الرسالة أولًا." }));
      const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds }, deletedAt: null }, select: { id: true, ownerUserId: true } });
      await prisma.notification.createMany({ data: tenants.map((tenant) => ({ tenantId: tenant.id, type: "admin_bulk_message", title, body, priority: "high" })) });
      await prisma.notificationLog.createMany({ data: tenants.map((tenant) => ({ tenantId: tenant.id, userId: tenant.ownerUserId, type: "info", title, body, category: "customer_lifecycle" })) });
      doneCount = tenants.length;
      await auditBulkAction({ action: action === "email" ? "CUSTOMERS_BULK_EMAIL_REQUESTED" : "CUSTOMERS_BULK_NOTIFIED", tenantIds, metadata: { title, body, emailConfigured: false } as Prisma.InputJsonObject });
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
