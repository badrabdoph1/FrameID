import "server-only";

import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";

import { createInAppCommunicationDeliveryAdapter } from "./in-app-adapter";
import { createCommunicationOutboxWorker } from "./outbox-worker";
import { createPrismaCommunicationOutboxRepository } from "./prisma-outbox-repository";

export function runCommunicationDeliveryBatch(workerId = `web-${randomUUID()}`) {
  const repository = createPrismaCommunicationOutboxRepository(prisma);
  const worker = createCommunicationOutboxWorker(
    repository,
    [createInAppCommunicationDeliveryAdapter(prisma)],
    { workerId, batchSize: 50, maxAttempts: 5 },
  );
  return worker.runOnce();
}
