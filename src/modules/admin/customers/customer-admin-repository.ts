import type { PrismaClient } from "@prisma/client";
import type {
  CustomerDetail,
  CustomerFilter,
  CustomerListResult,
  CustomerSiteInfo,
  CustomerSubscriptionInfo,
  CustomerPaymentInfo,
  CustomerActivityEntry,
  CustomerSessionInfo,
  CustomerExport,
  CustomerStatus,
} from "./customer-types";

type PrismaTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function mapCustomerStatus(dbStatus: string): CustomerStatus {
  if (dbStatus === "ARCHIVED") return "ARCHIVED";
  return dbStatus as CustomerStatus;
}

export function createCustomerAdminRepository(prisma: PrismaClient) {
  async function listCustomers(filter: CustomerFilter): Promise<CustomerListResult> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (filter.search) {
      where.OR = [
        { displayName: { contains: filter.search, mode: "insensitive" } },
        { owner: { name: { contains: filter.search, mode: "insensitive" } } },
        { owner: { email: { contains: filter.search, mode: "insensitive" } } },
      ];
    }

    if (filter.status && filter.status !== "ARCHIVED") {
      where.status = filter.status;
    }

    if (filter.status === "ARCHIVED") {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }

    const orderBy: Record<string, string> = {};
    if (filter.sortBy === "displayName") {
      orderBy.displayName = filter.sortOrder ?? "asc";
    } else if (filter.sortBy === "status") {
      orderBy.status = filter.sortOrder ?? "asc";
    } else {
      orderBy.createdAt = filter.sortOrder ?? "desc";
    }

    const [customers, total] = await Promise.all([
      prisma.tenant.findMany({
        where: where as never,
        orderBy: orderBy as never,
        skip,
        take: pageSize,
        select: {
          id: true,
          displayName: true,
          status: true,
          trialEndsAt: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              sites: true,
              payments: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where: where as never }),
    ]);

    return {
      customers: customers.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        ownerName: c.owner.name,
        ownerEmail: c.owner.email,
        ownerPhone: c.owner.phone,
        status: mapCustomerStatus(c.status),
        trialEndsAt: c.trialEndsAt?.toISOString() ?? null,
        sitesCount: c._count.sites,
        paymentsCount: c._count.payments,
        totalRevenue: 0,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            emailVerifiedAt: true,
            role: true,
          },
        },
        sites: {
          include: {
            theme: { select: { name: true } },
            domains: {
              where: { deletedAt: null, status: "VERIFIED" },
              select: { domain: true },
              take: 1,
            },
          },
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        subscriptions: {
          include: { plan: { select: { name: true, priceAmount: true } } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            sites: true,
            payments: true,
            mediaAssets: true,
            supportCases: true,
          },
        },
      },
    });

    if (!tenant) return null;

    const subscription = tenant.subscriptions[0] ?? null;
    const totalRevenue = tenant.payments
      .filter((p) => p.status === "APPROVED")
      .reduce((sum, p) => sum + p.amount, 0);

    const recentActivity = await prisma.auditLog.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { name: true } },
      },
    });

    return {
      id: tenant.id,
      displayName: tenant.displayName,
      owner: {
        id: tenant.owner.id,
        name: tenant.owner.name,
        email: tenant.owner.email,
        phone: tenant.owner.phone,
        createdAt: tenant.owner.createdAt.toISOString(),
        emailVerifiedAt: tenant.owner.emailVerifiedAt?.toISOString() ?? null,
        role: tenant.owner.role,
      },
      status: mapCustomerStatus(tenant.status),
      trialStartedAt: tenant.trialStartedAt?.toISOString() ?? null,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
      deletedAt: tenant.deletedAt?.toISOString() ?? null,
      sites: tenant.sites.map(mapSiteInfo),
      subscription: subscription ? mapSubscriptionInfo(subscription) : null,
      stats: {
        sitesCount: tenant._count.sites,
        paymentsCount: tenant._count.payments,
        mediaCount: tenant._count.mediaAssets,
        supportCasesCount: tenant._count.supportCases,
        totalRevenue,
      },
      recentPayments: tenant.payments.map(mapPaymentInfo),
      recentActivity: recentActivity.map(mapActivityEntry),
    };
  }

  function mapSiteInfo(site: {
    id: string;
    slug: string;
    title: string;
    status: string;
    isPublished: boolean;
    publishedVersion: number;
    createdAt: Date;
    theme: { name: string } | null;
    domains: { domain: string }[];
  }): CustomerSiteInfo {
    return {
      id: site.id,
      slug: site.slug,
      title: site.title,
      status: site.status as CustomerSiteInfo["status"],
      themeName: site.theme?.name ?? null,
      templateName: null,
      domain: site.domains[0]?.domain ?? null,
      isPublished: site.isPublished,
      publishedVersion: site.publishedVersion,
      createdAt: site.createdAt.toISOString(),
    };
  }

  function mapSubscriptionInfo(sub: {
    id: string;
    status: string;
    plan: { name: string; priceAmount: number } | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    activatedAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }): CustomerSubscriptionInfo {
    return {
      id: sub.id,
      status: sub.status as CustomerSubscriptionInfo["status"],
      planName: sub.plan?.name ?? null,
      planPrice: sub.plan?.priceAmount ?? null,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      activatedAt: sub.activatedAt?.toISOString() ?? null,
      expiresAt: sub.expiresAt?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
    };
  }

  function mapPaymentInfo(p: {
    id: string;
    method: string;
    amount: number;
    currency: string;
    status: string;
    reference: string | null;
    createdAt: Date;
    reviewedAt: Date | null;
    adminNote: string | null;
  }): CustomerPaymentInfo {
    return {
      id: p.id,
      method: p.method,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      reference: p.reference,
      createdAt: p.createdAt.toISOString(),
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
      adminNote: p.adminNote,
    };
  }

  function mapActivityEntry(a: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown> | null;
    actor: { name: string } | null;
    createdAt: Date;
  }): CustomerActivityEntry {
    return {
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      metadata: a.metadata as Record<string, unknown> | null,
      actorName: a.actor?.name ?? null,
      createdAt: a.createdAt.toISOString(),
    };
  }

  async function getCustomerSessions(ownerUserId: string): Promise<CustomerSessionInfo[]> {
    const sessions = await prisma.session.findMany({
      where: { userId: ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return sessions.map((s) => ({
      id: s.id,
      lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isRevoked: s.revokedAt !== null,
    }));
  }

  async function getCustomerPayments(
    tenantId: string,
  ): Promise<CustomerPaymentInfo[]> {
    const payments = await prisma.paymentRequest.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
    return payments.map(mapPaymentInfo);
  }

  async function getCustomerActivity(
    tenantId: string,
  ): Promise<CustomerActivityEntry[]> {
    const activity = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { actor: { select: { name: true } } },
    });
    return activity.map(mapActivityEntry);
  }

  async function getCustomerExport(id: string): Promise<CustomerExport | null> {
    const customer = await getCustomerDetail(id);
    if (!customer) return null;

    const payments = await getCustomerPayments(id);
    const activity = await getCustomerActivity(id);
    const sessions = await getCustomerSessions(customer.owner.id);

    return { customer, payments, activity, sessions };
  }

  async function updateCustomerStatus(
    id: string,
    status: CustomerStatus,
    actorId: string,
    reason?: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx: PrismaTransaction) => {
      if (status === "ARCHIVED") {
        await tx.tenant.update({
          where: { id },
          data: { status: "EXPIRED", deletedAt: new Date() },
        });
      } else if (status === "ACTIVE") {
        await tx.tenant.update({
          where: { id },
          data: { status, deletedAt: null },
        });
      } else {
        await tx.tenant.update({
          where: { id },
          data: { status, deletedAt: null },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          tenantId: id,
          action: `CUSTOMER_STATUS_${status}`,
          entityType: "Tenant",
          entityId: id,
          metadata: reason ? { reason } : undefined,
        },
      });
    });
  }

  async function deleteCustomer(
    id: string,
    actorId: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx: PrismaTransaction) => {
      const tenant = await tx.tenant.findUnique({
        where: { id },
        include: {
          sites: { select: { id: true } },
          payments: { select: { id: true } },
          subscriptions: { select: { id: true } },
        },
      });

      if (!tenant) throw new Error("Customer not found");

      await tx.auditLog.create({
        data: {
          actorUserId: actorId,
          tenantId: id,
          action: "CUSTOMER_DELETED",
          entityType: "Tenant",
          entityId: id,
          metadata: {
            sitesCount: tenant.sites.length,
            paymentsCount: tenant.payments.length,
            displayName: tenant.displayName,
          },
        },
      });

      await tx.siteDomain.updateMany({
        where: { siteId: { in: tenant.sites.map((s) => s.id) } },
        data: { deletedAt: new Date() },
      });

      await tx.site.updateMany({
        where: { tenantId: id },
        data: { deletedAt: new Date() },
      });

      await tx.subscription.updateMany({
        where: { tenantId: id },
        data: { deletedAt: new Date() },
      });

      await tx.paymentRequest.updateMany({
        where: { tenantId: id },
        data: { deletedAt: new Date() },
      });

      await tx.tenant.update({
        where: { id },
        data: { deletedAt: new Date(), status: "EXPIRED" },
      });
    });
  }

  async function createAuditLog(
    actorUserId: string,
    tenantId: string,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        tenantId,
        action,
        entityType,
        entityId,
        metadata: metadata as never,
      },
    });
  }

  async function updateUserPassword(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  return {
    listCustomers,
    getCustomerDetail,
    getCustomerSessions,
    getCustomerPayments,
    getCustomerActivity,
    getCustomerExport,
    updateCustomerStatus,
    deleteCustomer,
    createAuditLog,
    updateUserPassword,
  };
}

export type CustomerAdminRepository = ReturnType<typeof createCustomerAdminRepository>;
