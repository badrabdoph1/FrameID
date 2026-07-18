"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { CommunicationAttachmentInput } from "@/modules/communication-core/types";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import {
  acceptProcessedCommunicationAttachments,
  cleanupPreparedCommunicationAttachments,
  filesFromFormData,
  prepareCommunicationAttachments,
} from "@/modules/communication-center/attachment-service";
import { communicationCenterCommands } from "@/modules/communication-center/runtime";

const allowedRequestTypes = new Set([
  "support.question",
  "support.problem",
  "feedback.suggestion",
  "feature.request",
  "account.change",
  "billing.question",
  "report.general",
  "other.request",
]);

function required(formData: FormData, key: string, maxLength: number): string {
  const value = formData.get(key);
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) throw new Error(`${key} مطلوب.`);
  if (normalized.length > maxLength) throw new Error(`${key} أطول من الحد المسموح.`);
  return normalized;
}

function idempotency(formData: FormData, prefix: string, actorId: string): string {
  const provided = formData.get("idempotencyKey");
  const token = typeof provided === "string" ? provided.trim() : "";
  return `${prefix}:${actorId}:${token && token.length <= 200 ? token : randomUUID()}`;
}

async function customerSession() {
  const session = await getCurrentRequestSession();
  if (!session) redirect("/login");
  return session;
}

export async function createCustomerConversationAction(formData: FormData) {
  const session = await customerSession();
  const typeKey = required(formData, "typeKey", 100).toLowerCase();
  if (!allowedRequestTypes.has(typeKey)) redirect("/dashboard/communication/new?error=type");

  let conversationId = "";
  let attachments: CommunicationAttachmentInput[] = [];
  let attachmentsPersisted = false;
  try {
    attachments = await prepareCommunicationAttachments({
      files: filesFromFormData(formData),
      tenantId: session.tenant.id,
    });
    const idempotencyKey = idempotency(formData, "customer-request", session.user.id);
    const result = await communicationCenterCommands.createCustomerRequest({
      tenantId: session.tenant.id,
      userId: session.user.id,
      siteId: session.site.id,
      typeKey,
      subject: required(formData, "subject", 180),
      body: required(formData, "body", 20_000),
      attachments,
      idempotencyKey,
    });
    attachmentsPersisted = true;
    if (attachments.length > 0) {
      await acceptProcessedCommunicationAttachments(prisma, result.entryId);
    }
    conversationId = result.conversationId;
    revalidatePath("/dashboard/communication");
  } catch (error) {
    if (!attachmentsPersisted) await cleanupPreparedCommunicationAttachments(attachments);
    const message = error instanceof Error ? error.message : "تعذر إنشاء الطلب.";
    redirect(`/dashboard/communication/new?error=${encodeURIComponent(message)}`);
  }
  redirect(`/dashboard/communication/${conversationId}?created=1`);
}

export async function replyToCustomerConversationAction(formData: FormData) {
  const session = await customerSession();
  const conversationId = required(formData, "conversationId", 200);
  let attachments: CommunicationAttachmentInput[] = [];
  let attachmentsPersisted = false;
  try {
    attachments = await prepareCommunicationAttachments({
      files: filesFromFormData(formData),
      tenantId: session.tenant.id,
    });
    const result = await communicationCenterCommands.replyAsCustomer({
      conversationId,
      tenantId: session.tenant.id,
      userId: session.user.id,
      body: required(formData, "body", 20_000),
      attachments,
      idempotencyKey: idempotency(formData, "customer-reply", session.user.id),
    });
    attachmentsPersisted = true;
    if (attachments.length > 0) {
      await acceptProcessedCommunicationAttachments(prisma, result.entryId);
    }
    revalidatePath(`/dashboard/communication/${conversationId}`);
    revalidatePath("/dashboard/communication");
  } catch (error) {
    if (!attachmentsPersisted) await cleanupPreparedCommunicationAttachments(attachments);
    const message = error instanceof Error ? error.message : "تعذر إرسال الرد.";
    redirect(`/dashboard/communication/${conversationId}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/dashboard/communication/${conversationId}?sent=1`);
}

export async function resolveCustomerConversationAction(formData: FormData) {
  const session = await customerSession();
  const conversationId = required(formData, "conversationId", 200);
  const resolved = formData.get("resolved") === "true";
  try {
    await communicationCenterCommands.resolveAsCustomer({
      conversationId,
      tenantId: session.tenant.id,
      userId: session.user.id,
      resolved,
      idempotencyKey: idempotency(formData, "customer-resolution", session.user.id),
    });
    revalidatePath(`/dashboard/communication/${conversationId}`);
    revalidatePath("/dashboard/communication");
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر تحديث الطلب.";
    redirect(`/dashboard/communication/${conversationId}?error=${encodeURIComponent(message)}`);
  }
  redirect(`/dashboard/communication/${conversationId}?updated=1`);
}

export async function markCustomerConversationReadAction(conversationId: string) {
  const session = await customerSession();
  await communicationCenterCommands.markCustomerRead({ conversationId, tenantId: session.tenant.id, userId: session.user.id });
  revalidatePath("/dashboard/communication");
}
