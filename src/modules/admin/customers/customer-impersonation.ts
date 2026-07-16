import type { CreatedSession } from "@/modules/auth/session-service";

export type CustomerImpersonationActor = {
  id: string;
  name: string;
};

export type DashboardImpersonationTenant = {
  id: string;
  displayName: string;
  ownerUserId: string;
  firstSiteId: string | null;
};

export type CustomerDashboardImpersonationRepository = {
  findTenantForDashboardImpersonation(tenantId: string): Promise<DashboardImpersonationTenant | null>;
  createImpersonationSession(input: { adminId: string; tenantId: string; expiresAt: Date }): Promise<void>;
  createAuditLog(
    actorId: string,
    tenantId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata: { adminName: string; tenantName: string },
  ): Promise<void>;
};

export async function createCustomerDashboardImpersonation({
  tenantId,
  actor,
  repository,
  createSession,
  now = () => new Date(),
}: {
  tenantId: string;
  actor: CustomerImpersonationActor;
  repository: CustomerDashboardImpersonationRepository;
  createSession: (input: { userId: string }) => Promise<CreatedSession>;
  now?: () => Date;
}) {
  const tenant = await repository.findTenantForDashboardImpersonation(tenantId);
  if (!tenant) throw new Error("العميل غير موجود.");
  if (!tenant.firstSiteId) throw new Error("لا توجد لوحة تحكم جاهزة لهذا العميل.");

  const session = await createSession({ userId: tenant.ownerUserId });
  const expiresAt = new Date(now().getTime() + 1000 * 60 * 60);

  await repository.createImpersonationSession({
    adminId: actor.id,
    tenantId: tenant.id,
    expiresAt,
  });
  await repository.createAuditLog(actor.id, tenant.id, "ADMIN_IMPERSONATED", "Tenant", tenant.id, {
    adminName: actor.name,
    tenantName: tenant.displayName,
  });

  return {
    cookie: session.cookie,
    redirectTo: "/dashboard" as const,
  };
}
