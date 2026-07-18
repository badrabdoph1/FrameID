import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { runCommunicationLegacyBackfill } from "@/modules/communication-center/backfill";

describe("communication legacy backfill", () => {
  it("queries and publishes only missing legacy notifications", async () => {
    const prisma = {
      $queryRaw: vi.fn()
        .mockResolvedValueOnce([
          { id: "notification-2", tenantId: "tenant-2", type: "trial_expired", title: "انتهت التجربة", body: "فعّل اشتراكك" },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const bridge = {
      publishNotification: vi.fn(async () => ({})),
      publishCustomerRequest: vi.fn(async () => ({})),
      publishSupportCase: vi.fn(async () => ({})),
      publishCampaign: vi.fn(async () => ({})),
    };

    const result = await runCommunicationLegacyBackfill(prisma as unknown as PrismaClient, bridge, { limit: 100 });

    expect(result).toEqual({ notifications: 1, customerRequests: 0, supportCases: 0, campaigns: 0 });
    expect(bridge.publishNotification).toHaveBeenCalledTimes(1);
    expect(bridge.publishNotification).toHaveBeenCalledWith(expect.objectContaining({ sourceId: "notification-2" }));
  });
});
