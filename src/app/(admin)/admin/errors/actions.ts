"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { processError } from "@/lib/errors";
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
  try {
    await workflow.startReview(issueId);
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "startReview", issueId } });
    redirect(`/admin/errors/${issueId}?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function resolveIssueAction(issueId: string, formData?: FormData) {
  try {
    const note = formData?.get("resolutionNote");
    await workflow.resolveIssue(issueId, typeof note === "string" ? note : null);
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "resolveIssue", issueId } });
    redirect(`/admin/errors/${issueId}?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function reopenIssueAction(issueId: string) {
  try {
    await workflow.reopenIssue(issueId);
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "reopenIssue", issueId } });
    redirect(`/admin/errors/${issueId}?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function closeIssueAction(issueId: string) {
  try {
    await workflow.closeIssue(issueId);
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "closeIssue", issueId } });
    redirect(`/admin/errors/${issueId}?error=${encodeURIComponent(userError.message)}`);
  }
}

export async function notifyCustomerResolvedAction(issueId: string) {
  try {
    await workflow.notifyCustomerResolved(issueId);
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "notifyCustomerResolved", issueId } });
    redirect(`/admin/errors/${issueId}?error=${encodeURIComponent(userError.message)}`);
  }
}
