import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@prisma/client";
import { createCommunicationCore, createPrismaCommunicationRepository } from "@/modules/communication-core";

import { createServicesOutboxWorker, type ServicesEventHandler } from "./outbox-worker";
import { createPrismaServicesOutboxRepository } from "./prisma-outbox-repository";
import { createServicesPlatformRuntime } from "./runtime";

function stringPayload(payload: Record<string, unknown>, key: string) {
  return typeof payload[key] === "string" ? payload[key] as string : null;
}

const customerTimelineMessages: Readonly<Record<string, string>> = {
  "services.acquisition.requested": "تم استلام طلب الخدمة.",
  "services.acquisition.accepted": "تمت مراجعة الطلب وقبوله.",
  "services.payment.submitted": "تم استلام بيانات الدفع وجارٍ مراجعتها.",
  "services.payment.approved": "تم اعتماد الدفع.",
  "services.payment.rejected": "تعذر اعتماد الدفع. راجع تفاصيل الطلب أو تواصل مع الفريق.",
  "services.payment.refunded": "تم تسجيل استرداد الدفعة.",
  "services.acquisition.fulfilling": "بدأ الفريق تنفيذ الخدمة.",
  "services.acquisition.waiting_customer": "يحتاج الفريق معلومات أو إجراءً منك لاستكمال الخدمة.",
  "services.acquisition.waiting_internal": "الطلب بانتظار إجراء داخلي من فريق FrameID.",
  "services.acquisition.ready": "الخدمة جاهزة للمراجعة أو التسليم النهائي.",
  "services.acquisition.fulfilled": "اكتمل تنفيذ الخدمة وأصبحت جاهزة في حسابك.",
  "services.acquisition.cancelled": "تم إلغاء طلب الخدمة.",
  "services.acquisition.declined": "تعذر قبول طلب الخدمة.",
};

const workItemTargetStatus = {
  "services.acquisition.fulfilling": "IN_PROGRESS",
  "services.acquisition.waiting_customer": "WAITING_CUSTOMER",
  "services.acquisition.waiting_internal": "WAITING_INTERNAL",
  "services.acquisition.ready": "WAITING_INTERNAL",
  "services.acquisition.fulfilled": "RESOLVED",
} as const;

const allowedWorkItemTransitions: Readonly<Record<string, readonly string[]>> = {
  NEW: ["IN_PROGRESS", "WAITING_CUSTOMER"],
  IN_PROGRESS: ["WAITING_CUSTOMER", "WAITING_INTERNAL", "RESOLVED"],
  WAITING_CUSTOMER: ["IN_PROGRESS"],
  WAITING_INTERNAL: ["IN_PROGRESS"],
  RESOLVED: ["IN_PROGRESS", "CLOSED"],
  CLOSED: ["IN_PROGRESS"],
};

export function createDefaultServicesEventHandlers(prisma: PrismaClient): ServicesEventHandler[] {
  const communicationCore = createCommunicationCore(createPrismaCommunicationRepository(prisma));
  return [
    {
      eventName: "services.payment.approved",
      async handle(event) {
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        if (!acquisitionId) return;
        const acquisition = await prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { status: true } });
        if (acquisition && ["PAID", "ACCEPTED"].includes(acquisition.status)) {
          await createServicesPlatformRuntime(prisma).fulfillment.start({ acquisitionId, idempotencyKey: `fulfillment:${acquisitionId}` });
        }
      },
    },
    {
      eventName: "services.fulfillment.requested",
      async handle(event) {
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        if (!acquisitionId) return;
        const acquisition = await prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { status: true } });
        if (acquisition && ["PAID", "ACCEPTED"].includes(acquisition.status)) {
          await createServicesPlatformRuntime(prisma).fulfillment.start({ acquisitionId, idempotencyKey: `fulfillment:${acquisitionId}` });
        }
      },
    },
    {
      eventName: "services.fulfillment.retry.requested",
      async handle(event) {
        const runId = stringPayload(event.payload, "runId");
        if (!runId) return;
        await createServicesPlatformRuntime(prisma).fulfillment.retry({ runId, idempotencyKey: `fulfillment:${runId}:recovery` });
      },
    },
    {
      eventName: "services.payment.refunded",
      async handle(event) {
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        const tenantId = stringPayload(event.payload, "tenantId")
          ?? (acquisitionId ? (await prisma.acquisition.findUnique({ where: { id: acquisitionId }, select: { tenantId: true } }))?.tenantId : null);
        if (!acquisitionId || !tenantId) return;
        await createServicesPlatformRuntime(prisma).entitlements.revokeSource({ tenantId, sourceType: "ACQUISITION", sourceId: acquisitionId, reason: "PAYMENT_REFUNDED" });
        await prisma.$transaction([
          prisma.productInstance.updateMany({ where: { tenantId, acquisitionId, status: { in: ["PROVISIONING", "ACTIVE"] } }, data: { status: "SUSPENDED", suspendedAt: new Date() } }),
          prisma.serviceSubscription.updateMany({ where: { tenantId, acquisitionId, status: { in: ["TRIALING", "ACTIVE", "PAST_DUE", "GRACE_PERIOD", "SUSPENDED"] } }, data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: "PAYMENT_REFUNDED" } }),
        ]);
      },
    },
    {
      eventName: "*",
      async handle(event) {
        const tenantId = stringPayload(event.payload, "tenantId");
        const acquisitionId = stringPayload(event.payload, "acquisitionId");
        const offeringId = stringPayload(event.payload, "offeringId");
        const attributionId = stringPayload(event.payload, "attributionId");
        const analyticsName = ({
          "services.acquisition.requested": "acquisition.requested",
          "services.payment.submitted": "payment.submitted",
          "services.payment.approved": "payment.approved",
          "services.acquisition.fulfilled": "acquisition.fulfilled",
        } as Record<string, string>)[event.eventName] ?? event.eventName;
        await prisma.productAnalyticsEvent.upsert({
          where: { idempotencyKey: `outbox-analytics:${event.id}` },
          update: {},
          create: { tenantId, acquisitionId, offeringId, attributionId, name: analyticsName, version: event.eventVersion, idempotencyKey: `outbox-analytics:${event.id}`, properties: { sourceEventName: event.eventName, aggregateType: event.aggregateType, aggregateId: event.aggregateId } },
        });

        const timelineBody = customerTimelineMessages[event.eventName];
        if (!timelineBody) return;
        const resolvedAcquisitionId = acquisitionId ?? (event.aggregateType === "Acquisition" ? event.aggregateId : null);
        if (!resolvedAcquisitionId) return;
        const acquisition = await prisma.acquisition.findUnique({
          where: { id: resolvedAcquisitionId },
          select: { conversationId: true },
        });
        if (!acquisition?.conversationId) return;
        const conversation = await prisma.communicationConversation.findUnique({
          where: { id: acquisition.conversationId },
          select: {
            lastSequence: true,
            version: true,
            workItem: { select: { id: true, status: true } },
          },
        });
        if (!conversation) return;
        await communicationCore.appendSystemEvent({
          conversationId: acquisition.conversationId,
          systemKey: "services",
          eventName: event.eventName,
          body: timelineBody,
          metadata: { acquisitionId: resolvedAcquisitionId, sourceEventId: event.id },
          idempotencyKey: `services-timeline:${event.id}`,
          expectedLastSequence: conversation.lastSequence,
          expectedVersion: conversation.version,
          correlationId: event.correlationId,
          causationId: event.id,
        });

        const targetStatus = workItemTargetStatus[event.eventName as keyof typeof workItemTargetStatus];
        const workItem = conversation.workItem;
        if (targetStatus && workItem && workItem.status !== targetStatus && allowedWorkItemTransitions[workItem.status]?.includes(targetStatus)) {
          await communicationCore.transitionWorkItem({
            workItemId: workItem.id,
            actor: { type: "SYSTEM", systemKey: "services" },
            toStatus: targetStatus,
            reason: event.eventName,
            idempotencyKey: `services-work-item:${event.id}`,
            correlationId: event.correlationId,
            causationId: event.id,
          });
        }
      },
    },
  ];
}

export function runServicesOutboxBatch(prisma: PrismaClient, workerId = `services-${randomUUID()}`) {
  return createServicesOutboxWorker(createPrismaServicesOutboxRepository(prisma), createDefaultServicesEventHandlers(prisma), { workerId }).runOnce();
}
