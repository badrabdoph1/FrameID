import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { CustomerDetailClient } from "./customer-detail-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireSuperAdminSession();
  const { id } = await params;

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

  return (
    <AdminPageShell
      badge="العملاء"
      title={customer.displayName}
      description={`${customer.owner.email}`}
      backHref="/admin/customers"
      backLabel="العملاء"
    >
      <CustomerDetailClient
        customer={customer}
        media={mediaResult.assets}
        notifications={notifications}
        adminNotes={adminNotes}
        allSubscriptions={allSubs}
      />
    </AdminPageShell>
  );
}
