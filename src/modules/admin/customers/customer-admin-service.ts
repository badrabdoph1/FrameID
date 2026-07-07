import { hashPassword } from "@/modules/auth/password-hashing";
import type { CustomerAdminRepository } from "./customer-admin-repository";
import type {
  CustomerDetail,
  CustomerFilter,
  CustomerListResult,
  CustomerExport,
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
  };
}

export type CustomerAdminService = ReturnType<typeof createCustomerAdminService>;
