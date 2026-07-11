import { prisma } from "@/lib/prisma";
import { syncCustomerLifecycle } from "@/modules/lifecycle/customer-lifecycle";

export type AccessCheckResult = {
  allowed: boolean;
  reason: "ACTIVE" | "TRIAL" | "GRACE_PERIOD" | "EXPIRED" | "SUSPENDED" | "NO_SUBSCRIPTION";
};

type TenantAccessData = {
  id: string;
  status: string;
  trialEndsAt: Date;
  gracePeriodEndsAt: Date | null;
  subscriptions: Array<{ id: string; status: string; currentPeriodEnd: Date | null; expiresAt?: Date | null }>;
};

function isWithinGracePeriod(now: Date, gracePeriodEndsAt: Date | null): boolean {
  if (!gracePeriodEndsAt) return false;
  return gracePeriodEndsAt > now;
}

export async function checkSiteAccessBySlug(slug: string): Promise<{ result: AccessCheckResult; tenantId: string | null }> {
  const site = await prisma.site.findFirst({
    where: { slug, deletedAt: null },
    select: {
      tenantId: true,
      tenant: {
        select: {
          id: true,
          status: true,
          trialEndsAt: true,
          gracePeriodEndsAt: true,
          subscriptions: { where: {}, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, currentPeriodEnd: true, expiresAt: true } }
        }
      }
    }
  });

  if (!site) return { result: { allowed: true, reason: "ACTIVE" }, tenantId: null };
  const result = await checkTenantAccess(site.tenant);
  return { result, tenantId: site.tenant.id };
}

export async function checkTenantAccessById(tenantId: string): Promise<AccessCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      status: true,
      trialEndsAt: true,
      gracePeriodEndsAt: true,
      subscriptions: { where: {}, orderBy: { createdAt: "desc" }, take: 1, select: { id: true, status: true, currentPeriodEnd: true, expiresAt: true } }
    }
  });
  if (!tenant) return { allowed: false, reason: "NO_SUBSCRIPTION" };
  return checkTenantAccess(tenant);
}

export async function checkTenantAccess(tenant: TenantAccessData): Promise<AccessCheckResult> {
  const now = new Date();
  const sub = tenant.subscriptions[0];
  const subStatus = sub?.status;
  const subscriptionEnd = sub?.currentPeriodEnd ?? sub?.expiresAt ?? null;

  if (subStatus === "SUSPENDED" || tenant.status === "SUSPENDED") return { allowed: false, reason: "SUSPENDED" };

  if (subStatus === "ACTIVE" || tenant.status === "ACTIVE") {
    if (!subscriptionEnd || subscriptionEnd > now) return { allowed: true, reason: "ACTIVE" };
    await syncCustomerLifecycle(prisma, { tenantId: tenant.id, now, limit: 1 });
    return { allowed: false, reason: "EXPIRED" };
  }

  if (subStatus === "PAST_DUE") return { allowed: true, reason: "GRACE_PERIOD" };

  const trialExpired = tenant.trialEndsAt <= now;
  const inGrace = isWithinGracePeriod(now, tenant.gracePeriodEndsAt);

  if (subStatus === "TRIAL" || tenant.status === "TRIAL") {
    if (!trialExpired) return { allowed: true, reason: "TRIAL" };
    if (inGrace) return { allowed: true, reason: "GRACE_PERIOD" };
    await syncCustomerLifecycle(prisma, { tenantId: tenant.id, now, limit: 1 });
    return { allowed: false, reason: "EXPIRED" };
  }

  if (subStatus === "EXPIRED" || subStatus === "CANCELLED" || tenant.status === "EXPIRED" || tenant.status === "TRIAL_EXPIRED") {
    if (inGrace) return { allowed: true, reason: "GRACE_PERIOD" };
    return { allowed: false, reason: "EXPIRED" };
  }

  return { allowed: false, reason: "NO_SUBSCRIPTION" };
}
