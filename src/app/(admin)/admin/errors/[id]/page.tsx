import { notFound } from "next/navigation";

import { getCustomerIssueDetail } from "@/modules/customer-issues/admin-queries";
import { CustomerIssueDetailView } from "./customer-issue-detail-view";

export default async function CustomerIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await getCustomerIssueDetail(id);
  if (!issue) notFound();

  return <CustomerIssueDetailView issue={issue} />;
}
