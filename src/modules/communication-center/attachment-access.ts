import type { PrismaClient } from "@prisma/client";

export type CommunicationAttachmentViewer =
  | { type: "CUSTOMER"; tenantId: string }
  | { type: "ADMIN" };

export function findAccessibleCommunicationAttachment(
  prisma: PrismaClient,
  attachmentId: string,
  viewer: CommunicationAttachmentViewer,
) {
  return prisma.communicationAttachment.findFirst({
    where: {
      id: attachmentId.trim(),
      scanStatus: "CLEAN",
      deletedAt: null,
      ...(viewer.type === "CUSTOMER" ? {
        entry: {
          visibility: "CUSTOMER_AND_ADMIN",
          redactedAt: null,
          conversation: {
            audiences: {
              some: { tenantId: viewer.tenantId.trim(), deliveredAt: { not: null }, archivedAt: null, withdrawnAt: null },
            },
          },
        },
      } : {}),
    },
    select: {
      storageProvider: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
    },
  });
}
