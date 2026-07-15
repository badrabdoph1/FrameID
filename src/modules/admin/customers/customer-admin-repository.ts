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
  CustomerMediaAsset,
  CustomerNotification,
  CustomerAdminNote,
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
            theme: { select: { name: true, code: true } },
            domains: {
              select: { hostname: true, status: true },
            },
            seoSettings: {
              select: { title: true, description: true },
            },
            _count: {
              select: {
                packages: true,
                galleryAlbums: true,
                extraServices: true,
              },
            },
          },
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        subscriptions: {
          include: { plan: { select: { name: true, priceAmount: true, code: true } } },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            proofAsset: { select: { url: true } },
            reviewer: { select: { name: true } },
          },
        },
        supportCases: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, subject: true, status: true, createdAt: true },
        },
        _count: {
          select: {
            sites: true,
            payments: true,
            mediaAssets: true,
            supportCases: true,
            auditLogs: true,
            notifications: true,
            adminNotes: true,
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
      select: { id: true, action: true, entityType: true, entityId: true, metadata: true, actorId: true, createdAt: true },
    });

    const sessions = await prisma.session.findMany({
      where: { userId: tenant.ownerUserId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const mediaAgg = await prisma.mediaAsset.aggregate({
      where: { tenantId: id, deletedAt: null },
      _sum: { sizeBytes: true },
    });

    const totalImages = await prisma.mediaAsset.count({
      where: {
        tenantId: id,
        deletedAt: null,
        mimeType: { startsWith: "image/" },
      },
    });

    const totalPackages = await prisma.package.count({
      where: {
        site: { tenantId: id, deletedAt: null },
        deletedAt: null,
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
      allSubscriptions: tenant.subscriptions.map((sub) => ({
        id: sub.id,
        status: sub.status as CustomerSubscriptionInfo["status"],
        planName: sub.plan?.name ?? null,
        planPrice: sub.plan?.priceAmount ?? null,
        planCode: sub.plan?.code ?? null,
        currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
        currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
        expiresAt: sub.expiresAt?.toISOString() ?? null,
        createdAt: sub.createdAt.toISOString(),
      })),
      stats: {
        sitesCount: tenant._count.sites,
        paymentsCount: tenant._count.payments,
        mediaCount: tenant._count.mediaAssets,
        supportCasesCount: tenant._count.supportCases,
        auditLogsCount: tenant._count.auditLogs,
        notificationsCount: tenant._count.notifications,
        adminNotesCount: tenant._count.adminNotes,
        totalRevenue,
        totalStorageBytes: mediaAgg._sum.sizeBytes ?? 0,
        totalVisits: 0,
        totalImages,
        totalPackages,
        totalOrders: 0,
      },
      recentPayments: tenant.payments.map(mapPaymentInfo),
      recentActivity: recentActivity.map(mapActivityEntry),
      sessions: sessions.map((s) => ({
        id: s.id,
        lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        isRevoked: s.revokedAt !== null,
      })),
      supportCases: tenant.supportCases.map((sc) => ({
        id: sc.id,
        subject: sc.subject,
        status: sc.status,
        createdAt: sc.createdAt.toISOString(),
      })),
    };
  }

  function mapSiteInfo(site: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    status: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    theme: { name: string; code: string } | null;
    domains: { hostname: string; status: string }[];
    seoSettings: { title: string; description: string | null } | null;
    _count: { packages: number; galleryAlbums: number; extraServices: number };
  }): CustomerSiteInfo {
    return {
      id: site.id,
      slug: site.slug,
      title: site.title,
      description: site.description,
      status: site.status as CustomerSiteInfo["status"],
      themeName: site.theme?.name ?? null,
      themeCode: site.theme?.code ?? null,
      templateName: null,
      domain: site.domains[0]?.hostname ?? null,
      domains: site.domains.map((d) => ({ domain: d.hostname, status: d.status })),
      isPublished: site.isPublished,
      createdAt: site.createdAt.toISOString(),
      updatedAt: site.updatedAt.toISOString(),
      packagesCount: site._count.packages,
      albumsCount: site._count.galleryAlbums,
      extrasCount: site._count.extraServices,
      seo: site.seoSettings ? {
        title: site.seoSettings.title,
        description: site.seoSettings.description,
      } : null,
    };
  }

  function mapSubscriptionInfo(sub: {
    id: string;
    status: string;
    plan: { name: string; priceAmount: number; code: string } | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
  }): CustomerSubscriptionInfo {
    return {
      id: sub.id,
      status: sub.status as CustomerSubscriptionInfo["status"],
      planName: sub.plan?.name ?? null,
      planPrice: sub.plan?.priceAmount ?? null,
      planCode: sub.plan?.code ?? null,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
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
    note: string | null;
    proofAsset: { url: string } | null;
    reviewer: { name: string } | null;
  }): CustomerPaymentInfo {
    return {
      id: p.id,
      method: p.method,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      reference: p.reference,
      proofUrl: p.proofAsset?.url ?? null,
      reviewedByName: p.reviewer?.name ?? null,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
      reviewedAt: p.reviewedAt?.toISOString() ?? null,
    };
  }

  function mapActivityEntry(a: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: unknown;
    actorId: string | null;
    createdAt: Date;
  }): CustomerActivityEntry {
    return {
      id: a.id,
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      metadata: a.metadata as Record<string, unknown> | null,
      actorName: a.actorId ?? null,
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
      include: {
        proofAsset: { select: { url: true } },
        reviewer: { select: { name: true } },
      },
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
      select: { id: true, action: true, entityType: true, entityId: true, metadata: true, actorId: true, createdAt: true },
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
        await tx.subscription.updateMany({
          where: { tenantId: id },
          data: { status: "ACTIVE" },
        });
        await tx.featureFlag.deleteMany({
          where: {
            key: "platform.subscription.experience.override",
            scope: "TENANT",
            tenantId: id,
            siteId: null,
          },
        });
      } else {
        await tx.tenant.update({
          where: { id },
          data: { status, deletedAt: null },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actorId,
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
          actorId: actorId,
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

      await tx.domain.deleteMany({
        where: { siteId: { in: tenant.sites.map((s) => s.id) } },
      });

      await tx.site.updateMany({
        where: { tenantId: id },
        data: { deletedAt: new Date() },
      });

      await tx.subscription.deleteMany({
        where: { tenantId: id },
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
        actorId: actorUserId,
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

  async function getAllSubscriptions(tenantId: string): Promise<CustomerSubscriptionInfo[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true, priceAmount: true, code: true } } },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status as CustomerSubscriptionInfo["status"],
      planName: sub.plan?.name ?? null,
      planPrice: sub.plan?.priceAmount ?? null,
      planCode: sub.plan?.code ?? null,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      expiresAt: sub.expiresAt?.toISOString() ?? null,
      createdAt: sub.createdAt.toISOString(),
    }));
  }

  async function getCustomerMedia(tenantId: string): Promise<{ assets: CustomerMediaAsset[]; totalBytes: number }> {
    const assets = await prisma.mediaAsset.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        mimeType: true,
        sizeBytes: true,
        width: true,
        height: true,
        alt: true,
        createdAt: true,
      },
    });

    const totalBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);

    return {
      assets: assets.map((a) => ({
        id: a.id,
        url: a.url,
        mimeType: a.mimeType,
        sizeBytes: a.sizeBytes,
        width: a.width,
        height: a.height,
        alt: a.alt,
        createdAt: a.createdAt.toISOString(),
      })),
      totalBytes,
    };
  }

  async function getCustomerNotifications(tenantId: string): Promise<CustomerNotification[]> {
    const notifications = await prisma.notification.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async function getCustomerAdminNotes(tenantId: string): Promise<CustomerAdminNote[]> {
    const notes = await prisma.adminNote.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    });

    return notes.map((n) => ({
      id: n.id,
      body: n.body,
      authorName: n.author.name,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async function createAdminNote(tenantId: string, authorId: string, body: string): Promise<void> {
    await prisma.adminNote.create({
      data: { tenantId, authorId, body },
    });
  }

  async function deleteAdminNote(noteId: string): Promise<void> {
    await prisma.adminNote.delete({
      where: { id: noteId },
    });
  }

  async function revokeSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async function extendTrial(tenantId: string, newEndDate: Date, actorId: string): Promise<void> {
    await prisma.$transaction(async (tx: PrismaTransaction) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { trialEndsAt: newEndDate },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId,
          tenantId,
          action: "TRIAL_EXTENDED",
          entityType: "Tenant",
          entityId: tenantId,
          metadata: { newEndDate: newEndDate.toISOString() },
        },
      });
    });
  }

  async function activateSubscription(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE" },
    });
  }

  async function cancelSubscription(subscriptionId: string): Promise<void> {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });
  }

  async function toggleSiteStatus(siteId: string, isPublished: boolean): Promise<void> {
    await prisma.site.update({
      where: { id: siteId },
      data: { isPublished },
    });
  }

  async function toggleSiteSuspension(siteId: string, status: CustomerStatus): Promise<void> {
    await prisma.site.update({
      where: { id: siteId },
      data: { status: status as "SUSPENDED" | "PUBLISHED" | "DRAFT" | "EXPIRED" },
    });
  }

  async function createNotification(tenantId: string, type: string, title: string, body: string): Promise<void> {
    await prisma.notification.create({
      data: {
        tenantId,
        type,
        title,
        body,
      },
    });
  }

  async function getCustomerVisits(tenantId: string): Promise<number> {
    void tenantId;
    return 0;
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
    toggleSiteStatus,
    toggleSiteSuspension,
    createNotification,
    getCustomerVisits,
  };
}

export type CustomerAdminRepository = ReturnType<typeof createCustomerAdminRepository>;
