import "server-only";

import { prisma } from "@/lib/prisma";
import { createPrismaCommunicationRepository } from "@/modules/communication-core/prisma-communication-repository";
import { createCommunicationCore } from "@/modules/communication-core/service";

import { createCommunicationCenterCommands } from "./commands";
import { createPrismaCommunicationCenterQueries } from "./prisma-queries";
import { createCommunicationLegacyBridge } from "./legacy-bridge";

export const communicationCenterQueries = createPrismaCommunicationCenterQueries(prisma);
export const communicationCore = createCommunicationCore(createPrismaCommunicationRepository(prisma));
export const communicationCenterCommands = createCommunicationCenterCommands({
  core: communicationCore,
  queries: communicationCenterQueries,
});
export const communicationLegacyBridge = createCommunicationLegacyBridge(communicationCore);
