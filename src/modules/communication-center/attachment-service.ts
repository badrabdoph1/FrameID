import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import type { PrismaClient } from "@prisma/client";
import type { CommunicationAttachmentInput } from "@/modules/communication-core/types";
import { processImageFromFile } from "@/modules/media/image-processing-service";

export const MAX_COMMUNICATION_ATTACHMENTS = 5;
export const MAX_COMMUNICATION_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export class CommunicationAttachmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommunicationAttachmentError";
  }
}

export type CommunicationAttachmentStore = {
  id: string;
  put(input: { key: string; bytes: Uint8Array; mimeType: string }): Promise<void>;
  read(key: string): Promise<Uint8Array>;
  remove?(key: string): Promise<void>;
};

function safeObjectPath(root: string, key: string): string {
  const normalizedKey = key.trim().replaceAll("\\", "/");
  if (!normalizedKey || isAbsolute(normalizedKey) || normalizedKey.split("/").includes("..")) {
    throw new CommunicationAttachmentError("مسار المرفق غير صالح.");
  }
  const absoluteRoot = resolve(root);
  const objectPath = resolve(absoluteRoot, normalizedKey);
  const relativePath = relative(absoluteRoot, objectPath);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new CommunicationAttachmentError("مسار المرفق خارج التخزين الخاص.");
  }
  return objectPath;
}

export function createLocalCommunicationAttachmentStore({
  root = process.env.COMMUNICATION_ATTACHMENT_ROOT?.trim()
    || resolve(process.cwd(), ".data", "communication-attachments"),
}: { root?: string } = {}): CommunicationAttachmentStore {
  return {
    id: "communication-private-local",
    async put(input) {
      const objectPath = safeObjectPath(root, input.key);
      await mkdir(dirname(objectPath), { recursive: true, mode: 0o700 });
      await writeFile(objectPath, input.bytes, { mode: 0o600 });
    },
    async read(key) {
      return readFile(safeObjectPath(root, key));
    },
    async remove(key) {
      await unlink(safeObjectPath(root, key)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    },
  };
}

function normalizeTenantPath(tenantId: string): string {
  const normalized = tenantId.trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    throw new CommunicationAttachmentError("معرف العميل غير صالح لتخزين المرفق.");
  }
  return normalized;
}

export async function prepareCommunicationAttachments(input: {
  files: File[];
  tenantId: string;
  store?: CommunicationAttachmentStore;
  createId?: () => string;
}): Promise<CommunicationAttachmentInput[]> {
  if (input.files.length > MAX_COMMUNICATION_ATTACHMENTS) {
    throw new CommunicationAttachmentError(`الحد الأقصى للمرفقات هو ${MAX_COMMUNICATION_ATTACHMENTS} صور.`);
  }
  const tenantId = normalizeTenantPath(input.tenantId);
  const store = input.store ?? createLocalCommunicationAttachmentStore();
  const createId = input.createId ?? randomUUID;
  const attachments: CommunicationAttachmentInput[] = [];

  for (const file of input.files) {
    try {
      const processed = await processImageFromFile(file, {
        maxSizeBytes: MAX_COMMUNICATION_ATTACHMENT_BYTES,
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 82,
      });
      const storageKey = `${tenantId}/${createId()}.webp`;
      const checksumSha256 = createHash("sha256").update(processed.buffer).digest("hex");
      await store.put({ key: storageKey, bytes: processed.buffer, mimeType: processed.mimeType });
      attachments.push({
        storageProvider: store.id,
        storageKey,
        originalName: file.name.trim() || "screenshot",
        mimeType: processed.mimeType,
        sizeBytes: processed.sizeBytes,
        checksumSha256,
        width: processed.width,
        height: processed.height,
      });
    } catch (error) {
      await cleanupPreparedCommunicationAttachments(attachments, store);
      if (error instanceof CommunicationAttachmentError) throw error;
      const message = error instanceof Error ? error.message : "تعذر معالجة المرفق.";
      throw new CommunicationAttachmentError(message);
    }
  }
  return attachments;
}

export function filesFromFormData(formData: FormData, field = "attachments"): File[] {
  return formData.getAll(field).filter((value): value is File => value instanceof File && value.size > 0);
}

export async function cleanupPreparedCommunicationAttachments(
  attachments: CommunicationAttachmentInput[],
  store: CommunicationAttachmentStore = createLocalCommunicationAttachmentStore(),
): Promise<void> {
  if (!store.remove) return;
  await Promise.all(attachments
    .filter((attachment) => attachment.storageProvider === store.id)
    .map((attachment) => store.remove!(attachment.storageKey).catch(() => undefined)));
}

export async function acceptProcessedCommunicationAttachments(
  prisma: PrismaClient,
  entryId: string,
  scannedAt = new Date(),
): Promise<number> {
  const result = await prisma.communicationAttachment.updateMany({
    where: { entryId: entryId.trim(), scanStatus: "PENDING", deletedAt: null },
    data: { scanStatus: "CLEAN", scannedAt },
  });
  return result.count;
}
