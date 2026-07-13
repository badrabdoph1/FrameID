"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { createCustomerIssueAdminWorkflow } from "@/modules/customer-issues/admin-actions";
import { createCustomerIssueService } from "@/modules/customer-issues/customer-issue-service";
import { createPrismaCustomerIssueRepository } from "@/modules/customer-issues/prisma-customer-issue-repository";

const service = createCustomerIssueService(createPrismaCustomerIssueRepository(prisma));

const workflow = createCustomerIssueAdminWorkflow({
  service,
  async getAdmin() {
    const admin = await requireAdminPermission("support", "edit");
    return { id: admin.id };
  },
  revalidate: revalidatePath,
});

export async function startReviewAction(issueId: string) {
  await workflow.startReview(issueId);
}

export async function resolveIssueAction(issueId: string, formData?: FormData) {
  const note = formData?.get("resolutionNote");
  await workflow.resolveIssue(issueId, typeof note === "string" ? note : null);
}

export async function reopenIssueAction(issueId: string) {
  await workflow.reopenIssue(issueId);
}

export async function closeIssueAction(issueId: string) {
  await workflow.closeIssue(issueId);
}

export async function notifyCustomerResolvedAction(issueId: string) {
  await workflow.notifyCustomerResolved(issueId);
}
