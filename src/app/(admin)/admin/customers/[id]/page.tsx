import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { CustomerDetailClient } from "./customer-detail-client";
import { normalizeCustomerTab } from "./components/customer-tabs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminCustomerDetailPage({ params, searchParams }: Props) {
  await requireAdminPermission("customers", "view");
  const { id } = await params;
  const { tab } = await searchParams;

  const repo = createCustomerAdminRepository(prisma);
  const service = createCustomerAdminService(repo);

  const customer = await service.getCustomer(id);
  if (!customer) notFound();

  const [mediaResult, notifications, adminNotes, allSubs] = await Promise.all([
    service.getCustomerMedia(id),
    service.getCustomerNotifications(id),
    service.getCustomerAdminNotes(id),
    service.getAllSubscriptions(id),
  ]);
  const statusLabel = {
    ACTIVE: "نشط",
    TRIAL: "تجريبي",
    SUSPENDED: "موقوف",
    EXPIRED: "منتهي",
    TRIAL_EXPIRED: "انتهت التجربة",
    ARCHIVED: "مؤرشف",
  }[customer.status];

  return (
    <AdminPageShell
      badge={`حالة الحساب: ${statusLabel}`}
      title={customer.displayName}
      description={`${customer.owner.email}`}
      backHref="/admin/customers"
      backLabel="العملاء"
      actions={[{ label: "العملاء", href: "/admin/customers" }]}
    >
      <CustomerDetailClient
        initialTab={normalizeCustomerTab(tab)}
        customer={customer}
        media={mediaResult.assets}
        notifications={notifications}
        adminNotes={adminNotes}
        allSubscriptions={allSubs}
      />
    </AdminPageShell>
  );
}
