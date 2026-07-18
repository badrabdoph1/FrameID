import { describe, expect, it, vi } from "vitest";

import { runCommunicationReconciliation } from "@/modules/communication-center/reconciliation";

describe("communication reconciliation", () => {
  it("reports actionable delivery, attachment and SLA drift", async () => {
    const prisma = {
      communicationOutboxEvent: { count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(1).mockResolvedValueOnce(2) },
      communicationDeliveryAttempt: { count: vi.fn().mockResolvedValue(3) },
      communicationAttachment: { count: vi.fn().mockResolvedValue(2) },
      communicationWorkItem: { count: vi.fn().mockResolvedValue(5) },
      communicationAudience: { count: vi.fn().mockResolvedValue(1) },
    };

    const report = await runCommunicationReconciliation(prisma as never, new Date("2026-07-18T12:00:00.000Z"));

    expect(report.status).toBe("DEGRADED");
    expect(report.metrics).toEqual({
      readyOutboxEvents: 4,
      expiredOutboxLeases: 1,
      deadOutboxEvents: 2,
      failedDeliveryAttempts: 3,
      stalePendingAttachments: 2,
      overdueWorkItems: 5,
      undeliveredPublishedAudiences: 1,
    });
    expect(prisma.communicationOutboxEvent.count).toHaveBeenNthCalledWith(3, { where: { status: "DEAD_LETTER" } });
  });
});
