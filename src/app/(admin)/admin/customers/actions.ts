"use server";

import { prisma } from "@/lib/prisma";
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

export async function suspendCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  const reason = readFormString(formData, "reason");
  await service.suspendCustomer(id, { id: admin.id, name: admin.name }, reason);
}

export async function activateCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  await service.activateCustomer(id, { id: admin.id, name: admin.name });
}

export async function archiveCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  await service.archiveCustomer(id, { id: admin.id, name: admin.name });
}

export async function deleteCustomerAction(formData: FormData) {
  const { admin, service } = await getService();
  const id = readFormString(formData, "customerId");
  await service.deleteCustomer(id, { id: admin.id, name: admin.name });
}

export async function resetCustomerPasswordAction(formData: FormData) {
  const { admin, service } = await getService();
  const userId = readFormString(formData, "userId");
  const newPassword = readFormString(formData, "newPassword");
  await service.resetCustomerPassword(userId, newPassword, { id: admin.id, name: admin.name });
}

// === NEW ACTIONS ===

export async function extendCustomerTrialAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const days = readFormInt(formData, "days");
  await service.extendTrial(tenantId, days, { id: admin.id, name: admin.name });
}

export async function activateCustomerSubscriptionAction(formData: FormData) {
  const { admin, service } = await getService();
  const subscriptionId = readFormString(formData, "subscriptionId");
  const tenantId = readFormString(formData, "tenantId");
  await service.activateSubscription(subscriptionId, tenantId, { id: admin.id, name: admin.name });
}

export async function cancelCustomerSubscriptionAction(formData: FormData) {
  const { admin, service } = await getService();
  const subscriptionId = readFormString(formData, "subscriptionId");
  const tenantId = readFormString(formData, "tenantId");
  await service.cancelSubscription(subscriptionId, tenantId, { id: admin.id, name: admin.name });
}

export async function publishSiteAction(formData: FormData) {
  const { admin, service } = await getService();
  const siteId = readFormString(formData, "siteId");
  const tenantId = readFormString(formData, "tenantId");
  const publish = formData.get("publish") === "true";
  await service.publishSite(siteId, tenantId, { id: admin.id, name: admin.name }, publish);
}

export async function suspendSiteAction(formData: FormData) {
  const { admin, service } = await getService();
  const siteId = readFormString(formData, "siteId");
  const tenantId = readFormString(formData, "tenantId");
  const suspended = formData.get("suspended") === "true";
  await service.suspendSite(siteId, tenantId, { id: admin.id, name: admin.name }, suspended);
}

export async function revokeSessionAction(formData: FormData) {
  const { admin, service } = await getService();
  const sessionId = readFormString(formData, "sessionId");
  const tenantId = readFormString(formData, "tenantId");
  await service.revokeSession(sessionId, tenantId, { id: admin.id, name: admin.name });
}

export async function createAdminNoteAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const body = readFormString(formData, "body");
  await service.createAdminNote(tenantId, body, { id: admin.id, name: admin.name });
}

export async function deleteAdminNoteAction(formData: FormData) {
  const { admin, service } = await getService();
  const noteId = readFormString(formData, "noteId");
  await service.deleteAdminNote(noteId, { id: admin.id, name: admin.name });
}

export async function sendNotificationAction(formData: FormData) {
  const { admin, service } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const notificationType = readFormString(formData, "notificationType");
  const title = readFormString(formData, "title");
  const body = readFormString(formData, "body");
  await service.sendNotification(tenantId, notificationType, title, body, { id: admin.id, name: admin.name });
}

export async function impersonateCustomerAction(formData: FormData) {
  const { admin } = await getService();
  const tenantId = readFormString(formData, "tenantId");
  const repo = createCustomerAdminRepository(prisma);
  await repo.createAuditLog(
    admin.id, tenantId,
    "ADMIN_IMPERSONATED", "Tenant", tenantId,
    { adminName: admin.name }
  );
}
