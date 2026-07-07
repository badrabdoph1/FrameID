import { hashPassword } from "@/modules/auth/password-hashing";
import type { CustomerAdminRepository } from "./customer-admin-repository";
import type {
  CustomerDetail,
  CustomerFilter,
  CustomerListResult,
  CustomerExport,
  CustomerSubscriptionInfo,
  CustomerMediaAsset,
  CustomerNotification,
  CustomerAdminNote,
  CustomerAuditEntry,
} from "./customer-types";

export type AdminActor = {
  id: string;
  name: string;
};

export function createCustomerAdminService(repo: CustomerAdminRepository) {
  async function listCustomers(filter: CustomerFilter): Promise<CustomerListResult> {
    return repo.listCustomers(filter);
  }

  async function getCustomer(id: string): Promise<CustomerDetail | null> {
    return repo.getCustomerDetail(id);
  }

  async function suspendCustomer(
    id: string,
    actor: AdminActor,
    reason?: string,
  ): Promise<void> {
    await repo.updateCustomerStatus(id, "SUSPENDED", actor.id, reason);
  }

  async function activateCustomer(
    id: string,
    actor: AdminActor,
  ): Promise<void> {
    await repo.updateCustomerStatus(id, "ACTIVE", actor.id);
  }

  async function archiveCustomer(
    id: string,
    actor: AdminActor,
  ): Promise<void> {
    await repo.updateCustomerStatus(id, "ARCHIVED", actor.id);
  }

  async function deleteCustomer(
    id: string,
    actor: AdminActor,
  ): Promise<void> {
    await repo.deleteCustomer(id, actor.id);
  }

  async function resetCustomerPassword(
    customerOwnerId: string,
    newPassword: string,
    actor: AdminActor,
  ): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    await repo.updateUserPassword(customerOwnerId, passwordHash);
    await repo.createAuditLog(
      actor.id,
      customerOwnerId,
      "CUSTOMER_PASSWORD_RESET",
      "User",
      customerOwnerId,
      { resetBy: actor.name },
    );
  }

  async function getCustomerExport(id: string): Promise<CustomerExport | null> {
    return repo.getCustomerExport(id);
  }

  async function getCustomerActivity(
    tenantId: string,
  ): Promise<Awaited<ReturnType<CustomerAdminRepository["getCustomerActivity"]>>> {
    return repo.getCustomerActivity(tenantId);
  }

  async function getCustomerSessions(
    ownerUserId: string,
  ): Promise<Awaited<ReturnType<CustomerAdminRepository["getCustomerSessions"]>>> {
    return repo.getCustomerSessions(ownerUserId);
  }

  async function getCustomerPayments(
    tenantId: string,
  ): Promise<Awaited<ReturnType<CustomerAdminRepository["getCustomerPayments"]>>> {
    return repo.getCustomerPayments(tenantId);
  }

  async function getAllSubscriptions(tenantId: string): Promise<CustomerSubscriptionInfo[]> {
    return repo.getAllSubscriptions(tenantId);
  }

  async function getCustomerMedia(tenantId: string): Promise<{ assets: CustomerMediaAsset[]; totalBytes: number }> {
    return repo.getCustomerMedia(tenantId);
  }

  async function getCustomerNotifications(tenantId: string): Promise<CustomerNotification[]> {
    return repo.getCustomerNotifications(tenantId);
  }

  async function getCustomerAdminNotes(tenantId: string): Promise<CustomerAdminNote[]> {
    return repo.getCustomerAdminNotes(tenantId);
  }

  async function createAdminNote(tenantId: string, body: string, actor: AdminActor): Promise<void> {
    await repo.createAdminNote(tenantId, actor.id, body);
    await repo.createAuditLog(actor.id, tenantId, "ADMIN_NOTE_CREATED", "AdminNote", undefined, { body });
  }

  async function deleteAdminNote(noteId: string, actor: AdminActor): Promise<void> {
    await repo.deleteAdminNote(noteId);
    await repo.createAuditLog(actor.id, "", "ADMIN_NOTE_DELETED", "AdminNote", noteId);
  }

  async function revokeSession(sessionId: string, tenantId: string, actor: AdminActor): Promise<void> {
    await repo.revokeSession(sessionId);
  }

  async function extendTrial(tenantId: string, days: number, actor: AdminActor): Promise<void> {
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + days);
    await repo.extendTrial(tenantId, newEndDate, actor.id);
  }

  async function activateSubscription(subscriptionId: string, tenantId: string, actor: AdminActor): Promise<void> {
    await repo.activateSubscription(subscriptionId);
    await repo.createAuditLog(actor.id, tenantId, "SUBSCRIPTION_ACTIVATED", "Subscription", subscriptionId);
  }

  async function cancelSubscription(subscriptionId: string, tenantId: string, actor: AdminActor): Promise<void> {
    await repo.cancelSubscription(subscriptionId);
    await repo.createAuditLog(actor.id, tenantId, "SUBSCRIPTION_CANCELLED", "Subscription", subscriptionId);
  }

  async function publishSite(siteId: string, tenantId: string, actor: AdminActor, publish: boolean): Promise<void> {
    await repo.toggleSiteStatus(siteId, publish);
    await repo.createAuditLog(
      actor.id,
      tenantId,
      publish ? "SITE_PUBLISHED" : "SITE_UNPUBLISHED",
      "Site",
      siteId,
      { publish },
    );
  }

  async function suspendSite(siteId: string, tenantId: string, actor: AdminActor, suspended: boolean): Promise<void> {
    const status = suspended ? "SUSPENDED" : "PUBLISHED";
    await repo.toggleSiteSuspension(siteId, status as never);
    await repo.createAuditLog(
      actor.id,
      tenantId,
      suspended ? "SITE_SUSPENDED" : "SITE_UNSUSPENDED",
      "Site",
      siteId,
      { suspended },
    );
  }

  async function sendNotification(tenantId: string, type: string, title: string, body: string, actor: AdminActor): Promise<void> {
    await repo.createNotification(tenantId, type, title, body);
    await repo.createAuditLog(actor.id, tenantId, "NOTIFICATION_SENT", "Notification", undefined, { type, title });
  }

  async function getAuditEntries(tenantId: string): Promise<CustomerAuditEntry[]> {
    return repo.getCustomerActivity(tenantId);
  }

  return {
    listCustomers,
    getCustomer,
    suspendCustomer,
    activateCustomer,
    archiveCustomer,
    deleteCustomer,
    resetCustomerPassword,
    getCustomerExport,
    getCustomerActivity,
    getCustomerSessions,
    getCustomerPayments,
    getAllSubscriptions,
    getCustomerMedia,
    getCustomerNotifications,
    getCustomerAdminNotes,
    createAdminNote,
    deleteAdminNote,
    revokeSession,
    extendTrial,
    activateSubscription,
    cancelSubscription,
    publishSite,
    suspendSite,
    sendNotification,
    getAuditEntries,
  };
}

export type CustomerAdminService = ReturnType<typeof createCustomerAdminService>;
