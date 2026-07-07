"use server";

import { prisma } from "@/lib/prisma";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";

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
