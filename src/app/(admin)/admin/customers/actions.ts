"use server";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";

function readFormInt(formData: FormData, key: string): number {
  const val = parseInt(readFormString(formData, key), 10);
  return Number.isNaN(val) ? 0 : val;
}

async function getService() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Unauthorized");
  const repo = createCustomerAdminRepository(prisma);
  const service = createCustomerAdminService(repo);
  return { admin, service };
}

async function withErrorHandling<T>(
  action: string,
  fn: () => Promise<T>,
  context?: { userId?: string; tenantId?: string },
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    await processError(error, {
      userId: context?.userId,
      tenantId: context?.tenantId,
      metadata: { action },
    });
    throw error;
  }
}

export async function suspendCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  const reason = readFormString(formData, "reason");
  return withErrorHandling("suspendCustomer", () =>
    service.suspendCustomer(id, { id: admin.id, name: admin.name }, reason),
  );
}

export async function activateCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  return withErrorHandling("activateCustomer", () =>
    service.activateCustomer(id, { id: admin.id, name: admin.name }),
  );
}

export async function archiveCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  return withErrorHandling("archiveCustomer", () =>
    service.archiveCustomer(id, { id: admin.id, name: admin.name }),
  );
}

export async function deleteCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  return withErrorHandling("deleteCustomer", () =>
    service.deleteCustomer(id, { id: admin.id, name: admin.name }),
  );
}

export async function resetCustomerPasswordAction(formData: FormData) {
  const { admin, service } = await getService();
  const userId = readFormString(formData, "userId");
  const newPassword = readFormString(formData, "newPassword");
  return withErrorHandling("resetCustomerPassword", () =>
    service.resetCustomerPassword(userId, newPassword, {
      id: admin.id,
      name: admin.name,
    }),
  );
}

export async function extendCustomerTrialAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const days = readFormInt(formData, "days");
  return withErrorHandling("extendCustomerTrial", () =>
    service.extendTrial(tenantId, days, { id: admin.id, name: admin.name }),
    { userId: admin.id },
  );
}

export async function activateCustomerSubscriptionAction(
  formData: FormData,
) {
  const { admin, service } = await getService();
  const subscriptionId = readFormString(formData, "subscriptionId");
  const tenantId = readFormString(formData, "tenantId");
  return withErrorHandling("activateCustomerSubscription", () =>
    service.activateSubscription(subscriptionId, tenantId, {
      id: admin.id,
      name: admin.name,
    }),
    { userId: admin.id, tenantId },
  );
}

export async function cancelCustomerSubscriptionAction(formData: FormData) {
  const { admin, service } = await getService();
  const subscriptionId = readFormString(formData, "subscriptionId");
  const tenantId = readFormString(formData, "tenantId");
  return withErrorHandling("cancelCustomerSubscription", () =>
    service.cancelSubscription(subscriptionId, tenantId, {
      id: admin.id,
      name: admin.name,
    }),
    { userId: admin.id, tenantId },
  );
}

export async function publishSiteAction(formData: FormData) {
  const { admin, service } = await getService();
  const siteId = readFormString(formData, "siteId");
  const tenantId = readFormString(formData, "tenantId");
  const publish = formData.get("publish") === "true";
  return withErrorHandling("publishSite", () =>
    service.publishSite(
      siteId,
      tenantId,
      { id: admin.id, name: admin.name },
      publish,
    ),
    { userId: admin.id, tenantId },
  );
}

export async function suspendSiteAction(formData: FormData) {
  const { admin, service } = await getService();
  const siteId = readFormString(formData, "siteId");
  const tenantId = readFormString(formData, "tenantId");
  const suspended = formData.get("suspended") === "true";
  return withErrorHandling("suspendSite", () =>
    service.suspendSite(
      siteId,
      tenantId,
      { id: admin.id, name: admin.name },
      suspended,
    ),
    { userId: admin.id, tenantId },
  );
}

export async function revokeSessionAction(formData: FormData) {
  const { admin, service } = await getService();
  const sessionId = readFormString(formData, "sessionId");
  const tenantId = readFormString(formData, "tenantId");
  return withErrorHandling("revokeSession", () =>
    service.revokeSession(sessionId, tenantId, {
      id: admin.id,
      name: admin.name,
    }),
    { userId: admin.id, tenantId },
  );
}

export async function createAdminNoteAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const body = readFormString(formData, "body");
  return withErrorHandling("createAdminNote", () =>
    service.createAdminNote(tenantId, body, {
      id: admin.id,
      name: admin.name,
    }),
    { userId: admin.id, tenantId },
  );
}

export async function deleteAdminNoteAction(formData: FormData) {
  const { admin, service } = await getService();
  const noteId = readFormString(formData, "noteId");
  return withErrorHandling("deleteAdminNote", () =>
    service.deleteAdminNote(noteId, { id: admin.id, name: admin.name }),
  );
}

export async function sendNotificationAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const notificationType = readFormString(formData, "notificationType");
  const title = readFormString(formData, "title");
  const body = readFormString(formData, "body");
  return withErrorHandling("sendNotification", () =>
    service.sendNotification(tenantId, notificationType, title, body, {
      id: admin.id,
      name: admin.name,
    }),
    { userId: admin.id, tenantId },
  );
}

export async function impersonateCustomerAction(formData: FormData) {
  const { admin } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const repo = createCustomerAdminRepository(prisma);
  await repo.createAuditLog(
    admin.id,
    tenantId,
    "ADMIN_IMPERSONATED",
    "Tenant",
    tenantId,
    { adminName: admin.name },
  );
}
