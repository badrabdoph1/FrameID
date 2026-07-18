type CountModel = { count(input: unknown): Promise<number> };

type CommunicationReconciliationClient = {
  communicationOutboxEvent: CountModel;
  communicationDeliveryAttempt: CountModel;
  communicationAttachment: CountModel;
  communicationWorkItem: CountModel;
  communicationAudience: CountModel;
};

export type CommunicationReconciliationReport = {
  checkedAt: string;
  status: "HEALTHY" | "WARNING" | "DEGRADED";
  metrics: {
    readyOutboxEvents: number;
    expiredOutboxLeases: number;
    deadOutboxEvents: number;
    failedDeliveryAttempts: number;
    stalePendingAttachments: number;
    overdueWorkItems: number;
    undeliveredPublishedAudiences: number;
  };
};

export async function runCommunicationReconciliation(
  prisma: CommunicationReconciliationClient,
  now = new Date(),
): Promise<CommunicationReconciliationReport> {
  const staleAttachmentCutoff = new Date(now.getTime() - 60 * 60 * 1000);
  const [
    readyOutboxEvents,
    expiredOutboxLeases,
    deadOutboxEvents,
    failedDeliveryAttempts,
    stalePendingAttachments,
    overdueWorkItems,
    undeliveredPublishedAudiences,
  ] = await Promise.all([
    prisma.communicationOutboxEvent.count({ where: { status: "PENDING", availableAt: { lte: now } } }),
    prisma.communicationOutboxEvent.count({ where: { status: "PROCESSING", leaseExpiresAt: { lt: now } } }),
    prisma.communicationOutboxEvent.count({ where: { status: "DEAD_LETTER" } }),
    prisma.communicationDeliveryAttempt.count({ where: { status: "FAILED" } }),
    prisma.communicationAttachment.count({ where: { scanStatus: "PENDING", deletedAt: null, createdAt: { lt: staleAttachmentCutoff } } }),
    prisma.communicationWorkItem.count({
      where: {
        status: { notIn: ["RESOLVED", "CLOSED"] },
        OR: [{ firstResponseDueAt: { lt: now }, firstResponseAt: null }, { resolutionDueAt: { lt: now }, resolvedAt: null }],
      },
    }),
    prisma.communicationAudience.count({
      where: {
        deliveredAt: null,
        withdrawnAt: null,
        conversation: { campaign: { is: { status: "PUBLISHED" } } },
      },
    }),
  ]);
  const metrics = {
    readyOutboxEvents,
    expiredOutboxLeases,
    deadOutboxEvents,
    failedDeliveryAttempts,
    stalePendingAttachments,
    overdueWorkItems,
    undeliveredPublishedAudiences,
  };
  const degraded = deadOutboxEvents + failedDeliveryAttempts + stalePendingAttachments + undeliveredPublishedAudiences > 0;
  const warning = readyOutboxEvents + expiredOutboxLeases + overdueWorkItems > 0;
  return { checkedAt: now.toISOString(), status: degraded ? "DEGRADED" : warning ? "WARNING" : "HEALTHY", metrics };
}
