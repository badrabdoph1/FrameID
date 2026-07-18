import { prisma } from "@/lib/prisma";
import { runCommunicationLegacyBackfill } from "@/modules/communication-center/backfill";
import { createCommunicationLegacyBridge } from "@/modules/communication-center/legacy-bridge";
import { createPrismaCommunicationRepository } from "@/modules/communication-core/prisma-communication-repository";
import { createCommunicationCore } from "@/modules/communication-core/service";

const bridge = createCommunicationLegacyBridge(
  createCommunicationCore(createPrismaCommunicationRepository(prisma)),
);

async function main() {
  const totals = { notifications: 0, customerRequests: 0, supportCases: 0, campaigns: 0 };
  for (let batch = 0; batch < 10_000; batch += 1) {
    const result = await runCommunicationLegacyBackfill(prisma, bridge, { limit: 500 });
    totals.notifications += result.notifications;
    totals.customerRequests += result.customerRequests;
    totals.supportCases += result.supportCases;
    totals.campaigns += result.campaigns;
    if (result.notifications + result.customerRequests + result.supportCases + result.campaigns === 0) break;
  }
  console.log(JSON.stringify(totals));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
