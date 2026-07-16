import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  createCustomerOutreachCampaignAction,
  setCustomerOutreachCampaignStatusAction,
} from "./actions";
import { CustomerOutreachWorkspace } from "./customer-outreach-workspace";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ sent?: string; statusChanged?: string; error?: string }>;
};

export default async function CustomerOutreachPage({ searchParams }: Props) {
  await requireAdminPermission("messages", "view");
  const params = await searchParams;
  const [customers, plans, campaigns, active, paused, recipients] = await Promise.all([
    prisma.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        displayName: true,
        status: true,
        owner: { select: { name: true, email: true } },
        subscriptions: {
          where: { deletedAt: null },
          select: { status: true, planId: true, plan: { select: { name: true } } },
        },
      },
    }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.customerMessageCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        recipients: {
          orderBy: { createdAt: "asc" },
          take: 50,
          include: { tenant: { select: { status: true } } },
        },
        _count: { select: { recipients: true } },
      },
    }),
    prisma.customerMessageCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.customerMessageCampaign.count({ where: { status: "PAUSED" } }),
    prisma.customerMessageRecipient.count(),
  ]);

  const feedback = params.error
    ? { tone: "danger" as const, text: params.error, clearDraft: false }
    : params.sent
      ? { tone: "success" as const, text: `تم إرسال الرسالة إلى ${Number(params.sent).toLocaleString("ar-EG")} عميل.`, clearDraft: true }
      : params.statusChanged
        ? { tone: "success" as const, text: params.statusChanged === "PAUSED" ? "تم إيقاف الحملة وإخفاؤها من لوحات العملاء." : "تم تشغيل الحملة وإعادتها إلى لوحات العملاء.", clearDraft: false }
        : null;

  return (
    <AdminPageShell
      badge="الرسائل"
      title="مراسلة العميل"
      description="اكتب رسالة واحدة، حدد جمهورها بدقة، وتابع من وصلتهم مع إمكانية إيقاف ظهورها أو تشغيلها في أي وقت."
      breadcrumbs={[
        { label: "التواصل", href: "/admin/communications" },
        { label: "الرسائل", href: "/admin/messages" },
        { label: "مراسلة العميل" },
      ]}
    >
      <CustomerOutreachWorkspace
        customers={customers.map((customer) => ({
          id: customer.id,
          displayName: customer.displayName,
          ownerName: customer.owner.name,
          ownerEmail: customer.owner.email,
          status: customer.status,
          subscriptions: customer.subscriptions.map((subscription) => ({
            status: subscription.status,
            planId: subscription.planId,
          })),
        }))}
        plans={plans}
        campaigns={campaigns.map((campaign) => ({
          id: campaign.id,
          title: campaign.title,
          body: campaign.body,
          tone: campaign.tone,
          status: campaign.status,
          audienceMode: campaign.audienceMode,
          createdByName: campaign.createdByName,
          createdAt: campaign.createdAt.toISOString(),
          pausedAt: campaign.pausedAt?.toISOString() ?? null,
          recipientCount: campaign._count.recipients,
          recipients: campaign.recipients.map((recipient) => ({
            id: recipient.id,
            tenantId: recipient.tenantId,
            tenantName: recipient.tenantName,
            ownerName: recipient.ownerName,
            ownerEmail: recipient.ownerEmail,
            tenantStatus: recipient.tenant?.status ?? "DELETED",
          })),
        }))}
        stats={{ active, paused, recipients }}
        feedback={feedback}
        createAction={createCustomerOutreachCampaignAction}
        statusAction={setCustomerOutreachCampaignStatusAction}
      />
    </AdminPageShell>
  );
}
