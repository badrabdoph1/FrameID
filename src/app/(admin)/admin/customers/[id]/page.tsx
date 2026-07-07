import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { CustomerDetailClient } from "./customer-detail-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireSuperAdminSession();
  const { id } = await params;

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
        where: { deletedAt: null },
        include: {
          theme: { select: { name: true } },
          domains: {
            where: { deletedAt: null, status: "VERIFIED" },
            select: { domain: true },
            take: 1,
          },
          seoSettings: {
            select: { title: true, description: true },
          },
          _count: {
            select: {
              packages: true,
              albums: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      subscriptions: {
        where: { deletedAt: null },
        include: { plan: { select: { name: true, priceAmount: true, code: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      payments: {
        where: { deletedAt: null },
        include: {
          proofAsset: { select: { url: true } },
          reviewedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      supportCases: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          sites: true,
          payments: true,
          mediaAssets: true,
          supportCases: true,
          auditLogs: true,
          notifications: true,
        },
      },
    },
  });

  if (!tenant) notFound();

  const subscription = tenant.subscriptions[0] ?? null;

  const totalRevenue = tenant.payments
    .filter((p) => p.status === "APPROVED")
    .reduce((sum, p) => sum + p.amount, 0);

  const recentActivity = await prisma.auditLog.findMany({
    where: { tenantId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      actor: { select: { name: true } },
    },
  });

  const sessions = await prisma.session.findMany({
    where: { userId: tenant.owner.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const currentAdmin = await prisma.adminUser.findFirst({
    where: { email: (await requireSuperAdminSession()).user.email },
  });

  return (
    <AdminPageShell
      badge="العملاء"
      title={tenant.displayName}
      description={`${tenant.owner.email}`}
      backHref="/admin/customers"
      backLabel="العملاء"
    >
      <CustomerDetailClient
        customer={{
          id: tenant.id,
          displayName: tenant.displayName,
          owner: {
            id: tenant.owner.id,
            name: tenant.owner.name,
            email: tenant.owner.email,
            phone: tenant.owner.phone,
            role: tenant.owner.role,
            createdAt: tenant.owner.createdAt.toISOString(),
            emailVerifiedAt: tenant.owner.emailVerifiedAt?.toISOString() ?? null,
          },
          status: tenant.status,
          trialStartedAt: tenant.trialStartedAt?.toISOString() ?? null,
          trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
          createdAt: tenant.createdAt.toISOString(),
          updatedAt: tenant.updatedAt.toISOString(),
          deletedAt: tenant.deletedAt?.toISOString() ?? null,
          sites: tenant.sites.map((s) => ({
            id: s.id,
            slug: s.slug,
            title: s.title,
            status: s.status,
            themeName: s.theme?.name ?? null,
            domain: s.domains[0]?.domain ?? null,
            isPublished: s.isPublished,
            publishedVersion: s.publishedVersion,
            createdAt: s.createdAt.toISOString(),
            packagesCount: s._count.packages,
            albumsCount: s._count.albums,
            seo: s.seoSettings
              ? { title: s.seoSettings.title, description: s.seoSettings.description }
              : null,
          })),
          subscription: subscription
            ? {
                id: subscription.id,
                status: subscription.status,
                planName: subscription.plan?.name ?? null,
                planPrice: subscription.plan?.priceAmount ?? null,
                planCode: subscription.plan?.code ?? null,
                currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                activatedAt: subscription.activatedAt?.toISOString() ?? null,
                expiresAt: subscription.expiresAt?.toISOString() ?? null,
                createdAt: subscription.createdAt.toISOString(),
              }
            : null,
          stats: {
            sitesCount: tenant._count.sites,
            paymentsCount: tenant._count.payments,
            mediaCount: tenant._count.mediaAssets,
            supportCasesCount: tenant._count.supportCases,
            auditLogsCount: tenant._count.auditLogs,
            notificationsCount: tenant._count.notifications,
            totalRevenue,
          },
          recentPayments: tenant.payments.map((p) => ({
            id: p.id,
            method: p.method,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            reference: p.reference,
            createdAt: p.createdAt.toISOString(),
            reviewedAt: p.reviewedAt?.toISOString() ?? null,
            adminNote: p.adminNote,
            proofUrl: p.proofAsset?.url ?? null,
            reviewedByName: p.reviewedBy?.name ?? null,
          })),
          recentActivity: recentActivity.map((a) => ({
            id: a.id,
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            metadata: a.metadata as Record<string, unknown> | null,
            actorName: a.actor?.name ?? null,
            createdAt: a.createdAt.toISOString(),
          })),
          sessions: sessions.map((s) => ({
            id: s.id,
            lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            createdAt: s.createdAt.toISOString(),
            expiresAt: s.expiresAt.toISOString(),
            isRevoked: s.revokedAt !== null,
          })),
          supportCases: tenant.supportCases.map((c) => ({
            id: c.id,
            subject: c.subject,
            status: c.status,
            priority: c.priority,
            createdAt: c.createdAt.toISOString(),
          })),
        }}
        adminId={currentAdmin?.id ?? ""}
        adminName={currentAdmin?.name ?? "Admin"}
      />
    </AdminPageShell>
  );
}
