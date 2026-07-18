"use server";

import { randomUUID } from "node:crypto";

import type { CommunicationPriority, CommunicationWorkItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { CommunicationAttachmentInput } from "@/modules/communication-core/types";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import {
  acceptProcessedCommunicationAttachments,
  cleanupPreparedCommunicationAttachments,
  filesFromFormData,
  prepareCommunicationAttachments,
} from "@/modules/communication-center/attachment-service";
import { communicationCenterCommands, communicationCenterQueries } from "@/modules/communication-center/runtime";

const statuses = new Set<CommunicationWorkItemStatus>(["NEW", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_INTERNAL", "RESOLVED", "CLOSED"]);
const priorities = new Set<CommunicationPriority>(["LOW", "NORMAL", "HIGH", "URGENT"]);

function text(formData: FormData, key: string, required = true): string {
  const value = formData.get(key);
  const normalized = typeof value === "string" ? value.trim() : "";
  if (required && !normalized) throw new Error(`${key} مطلوب.`);
  return normalized;
}

function requestKey(formData: FormData, prefix: string, actorId: string): string {
  const supplied = text(formData, "idempotencyKey", false);
  return `${prefix}:${actorId}:${supplied && supplied.length <= 200 ? supplied : randomUUID()}`;
}

export async function manageAdminConversationAction(formData: FormData) {
  const operation = text(formData, "operation");
  const conversationId = text(formData, "conversationId");
  const permission = operation === "reply" || operation === "note" ? "edit" : "edit";
  const admin = await requireAdminPermission("support", permission);
  const detail = await communicationCenterQueries.getAdminConversation(conversationId);
  if (!detail) redirect("/admin/communications?error=not-found");

  let attachments: CommunicationAttachmentInput[] = [];
  let attachmentsPersisted = false;
  try {
    if (operation === "reply" || operation === "note") {
      if (!detail.tenant) throw new Error("لا يمكن إضافة مرفق أو رد إلى محادثة بلا عميل مباشر.");
      attachments = await prepareCommunicationAttachments({ files: filesFromFormData(formData), tenantId: detail.tenant.id });
      const result = await communicationCenterCommands.replyAsAdmin({
        conversationId,
        adminUserId: admin.id,
        body: text(formData, "body"),
        internal: operation === "note",
        attachments,
        idempotencyKey: requestKey(formData, `admin-${operation}`, admin.id),
      });
      attachmentsPersisted = true;
      if (attachments.length > 0) await acceptProcessedCommunicationAttachments(prisma, result.entryId);
    } else if (operation === "status") {
      const status = text(formData, "status") as CommunicationWorkItemStatus;
      if (!statuses.has(status)) throw new Error("الحالة غير صالحة.");
      await communicationCenterCommands.transitionAsAdmin({
        conversationId,
        adminUserId: admin.id,
        toStatus: status,
        reason: text(formData, "reason", false) || null,
        idempotencyKey: requestKey(formData, "admin-status", admin.id),
      });
    } else if (operation === "priority") {
      const priority = text(formData, "priority") as CommunicationPriority;
      if (!priorities.has(priority)) throw new Error("الأولوية غير صالحة.");
      await communicationCenterCommands.manageAsAdmin({
        conversationId,
        adminUserId: admin.id,
        change: { type: "PRIORITY", priority },
        idempotencyKey: requestKey(formData, "admin-priority", admin.id),
      });
    } else if (operation === "assignee") {
      await communicationCenterCommands.manageAsAdmin({
        conversationId,
        adminUserId: admin.id,
        change: { type: "ASSIGNEE", assigneeAdminUserId: text(formData, "assigneeAdminUserId", false) || null },
        idempotencyKey: requestKey(formData, "admin-assignee", admin.id),
      });
    } else {
      throw new Error("العملية غير مدعومة.");
    }
    revalidatePath(`/admin/communications/${conversationId}`);
    revalidatePath("/admin/communications");
  } catch (error) {
    if (!attachmentsPersisted) await cleanupPreparedCommunicationAttachments(attachments);
    const message = error instanceof Error ? error.message : "تعذر تنفيذ العملية.";
    redirect(`/admin/communications/${conversationId}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/admin/communications/${conversationId}?updated=1`);
}

export async function markAdminConversationReadAction(conversationId: string) {
  const admin = await requireAdminPermission("support", "view");
  await communicationCenterCommands.markAdminRead({ conversationId, adminUserId: admin.id });
  revalidatePath("/admin/communications");
}
