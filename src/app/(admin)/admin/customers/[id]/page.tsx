import { notFound } from "next/navigation";
import { Activity } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { createCustomerAdminRepository } from "@/modules/admin/customers/customer-admin-repository";
import { createCustomerAdminService } from "@/modules/admin/customers/customer-admin-service";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { CustomerDetailClient } from "./customer-detail-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireAdminPermission("customers", "view");
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
      badge="إدارة العميل"
      title={customer.displayName}
      description={`${customer.owner.email}`}
      backHref="/admin/customers"
      backLabel="العملاء"
      actions={[{ label: "العملاء", href: "/admin/customers" }]}
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
