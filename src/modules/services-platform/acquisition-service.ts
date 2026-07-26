import { assertAcquisitionTransition, type AcquisitionLifecycleStatus } from "./acquisition-state-machine";

export type AcquisitionRecord = {
  id: string;
  tenantId: string;
  offeringId: string;
  offeringName: string;
  status: AcquisitionLifecycleStatus;
  correlationId: string;
  conversationId: string | null;
  workItemRequired: boolean;
};

export interface AcquisitionRepository {
  createFromCatalog(input: {
    tenantId: string;
    userId: string;
    offeringId: string;
    idempotencyKey: string;
    attributionId?: string | null;
    customerMessage?: string | null;
  }): Promise<AcquisitionRecord>;
  attachConversation(input: { acquisitionId: string; conversationId: string; requestedAt: Date }): Promise<{ id: string; status: AcquisitionLifecycleStatus; conversationId: string }>;
  getState(acquisitionId: string): Promise<{ status: AcquisitionLifecycleStatus } | null>;
  transition(input: { acquisitionId: string; fromStatus: AcquisitionLifecycleStatus; toStatus: AcquisitionLifecycleStatus; occurredAt: Date; reason?: string | null }): Promise<void>;
}

export interface ServicesCommunicationPort {
  openServiceRequest(input: {
    tenantId: string;
    userId: string;
    offeringName: string;
    customerMessage: string;
    idempotencyKey: string;
    correlationId: string;
    context: { namespace: "services"; entityType: "acquisition"; entityId: string; relationKey: "primary" };
    workItemRequired: boolean;
  }): Promise<{ conversationId: string; workItemId: string | null }>;
}

export function createAcquisitionService(
  repository: AcquisitionRepository,
  communication: ServicesCommunicationPort,
  now: () => Date = () => new Date(),
) {
  return {
    async requestOffering(input: {
      tenantId: string;
      userId: string;
      offeringId: string;
      idempotencyKey: string;
      attributionId?: string | null;
      customerMessage?: string | null;
    }) {
      const acquisition = await repository.createFromCatalog(input);
      if (acquisition.conversationId) {
        return { ...acquisition, workItemId: null };
      }

      const opened = await communication.openServiceRequest({
        tenantId: acquisition.tenantId,
        userId: input.userId,
        offeringName: acquisition.offeringName,
        customerMessage: input.customerMessage?.trim() || `أرغب في طلب خدمة ${acquisition.offeringName}.`,
        idempotencyKey: `services:${acquisition.tenantId}:${input.idempotencyKey}`,
        correlationId: acquisition.correlationId,
        context: { namespace: "services", entityType: "acquisition", entityId: acquisition.id, relationKey: "primary" },
        workItemRequired: acquisition.workItemRequired,
      });
      const attached = await repository.attachConversation({
        acquisitionId: acquisition.id,
        conversationId: opened.conversationId,
        requestedAt: now(),
      });
      return { ...acquisition, ...attached, workItemId: opened.workItemId };
    },
    async transition(input: { acquisitionId: string; toStatus: AcquisitionLifecycleStatus; reason?: string | null }) {
      const current = await repository.getState(input.acquisitionId);
      if (!current) throw new Error(`Acquisition not found: ${input.acquisitionId}`);
      assertAcquisitionTransition(current.status, input.toStatus);
      await repository.transition({
        acquisitionId: input.acquisitionId,
        fromStatus: current.status,
        toStatus: input.toStatus,
        occurredAt: now(),
        reason: input.reason,
      });
    },
  };
}
