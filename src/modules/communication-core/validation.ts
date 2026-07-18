import type {
  CommunicationActor,
  CommunicationAttachmentInput,
  CommunicationContextReferenceInput,
  CommunicationConversationMode,
  CommunicationEntryKind,
  CommunicationVisibility,
} from "./types";

export function assertConversationScope(
  mode: CommunicationConversationMode,
  tenantId: string | null,
): void {
  const hasTenant = Boolean(tenantId?.trim());
  if (mode === "DIRECT" && !hasTenant) {
    throw new Error("المحادثة المباشرة يجب أن ترتبط بعميل واحد.");
  }
  if (mode === "BROADCAST" && hasTenant) {
    throw new Error("المحادثة الجماعية تحدد العملاء من الجمهور، لا من tenantId.");
  }
}

export function assertEntryAccess(
  actor: CommunicationActor,
  kind: CommunicationEntryKind,
  visibility: CommunicationVisibility,
): void {
  if (actor.type === "CUSTOMER" && (visibility === "ADMIN_ONLY" || kind === "INTERNAL_NOTE")) {
    throw new Error("العميل لا يستطيع إنشاء ملاحظة داخلية أو محتوى خاص بالأدمن.");
  }
  if (kind === "INTERNAL_NOTE" && visibility !== "ADMIN_ONLY") {
    throw new Error("الملاحظة الداخلية يجب أن تكون مرئية للأدمن فقط.");
  }
}

export function normalizeActor(actor: CommunicationActor): CommunicationActor {
  if (actor.type === "CUSTOMER") {
    const userId = actor.userId.trim();
    if (!userId) throw new Error("هوية العميل مطلوبة.");
    return { type: "CUSTOMER", userId };
  }
  if (actor.type === "ADMIN") {
    const adminUserId = actor.adminUserId.trim();
    if (!adminUserId) throw new Error("هوية الأدمن مطلوبة.");
    return { type: "ADMIN", adminUserId };
  }
  const systemKey = actor.systemKey.trim().toLowerCase();
  if (!systemKey) throw new Error("هوية النظام مطلوبة.");
  assertStableKey(systemKey, "systemKey");
  return { type: "SYSTEM", systemKey };
}

export function normalizeContextReference(
  input: CommunicationContextReferenceInput,
): CommunicationContextReferenceInput {
  const namespace = normalizeStableKey(input.namespace, "namespace");
  const entityType = normalizeStableKey(input.entityType, "entityType");
  const relationKey = normalizeStableKey(input.relationKey, "relationKey");
  const entityId = input.entityId.trim();
  if (!entityId || entityId.length > 200) {
    throw new Error("entityId يجب أن يكون معرفًا غير فارغ لا يزيد على 200 حرف.");
  }
  return { namespace, entityType, entityId, relationKey };
}

export function normalizeStableKey(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  assertStableKey(normalized, label);
  return normalized;
}

export function normalizeRequiredText(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} مطلوب.`);
  if (normalized.length > maximumLength) {
    throw new Error(`${label} يجب ألا يزيد على ${maximumLength} حرفًا.`);
  }
  return normalized;
}

export function normalizeOptionalIdentifier(value: string | null | undefined, label: string): string | null {
  if (value == null) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 200) throw new Error(`${label} غير صالح.`);
  return normalized;
}

export function normalizeAttachment(input: CommunicationAttachmentInput): CommunicationAttachmentInput {
  const sizeBytes = input.sizeBytes;
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > 25 * 1024 * 1024) {
    throw new Error("حجم المرفق غير صالح أو يتجاوز 25 ميجابايت.");
  }
  const checksumSha256 = input.checksumSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(checksumSha256)) throw new Error("بصمة المرفق غير صالحة.");
  const dimension = (value: number | null | undefined, label: string) => {
    if (value == null) return null;
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} المرفق غير صالح.`);
    return value;
  };
  return {
    storageProvider: normalizeStableKey(input.storageProvider, "storageProvider"),
    storageKey: normalizeRequiredText(input.storageKey, "مفتاح التخزين", 500),
    originalName: normalizeRequiredText(input.originalName, "اسم المرفق", 255),
    mimeType: normalizeRequiredText(input.mimeType, "نوع المرفق", 120).toLowerCase(),
    sizeBytes,
    checksumSha256,
    width: dimension(input.width, "عرض"),
    height: dimension(input.height, "ارتفاع"),
  };
}

function assertStableKey(value: string, label: string): void {
  if (!/^[a-z][a-z0-9._-]{0,79}$/.test(value)) {
    throw new Error(`${label} يجب أن يكون مفتاحًا ثابتًا صغير الأحرف بلا مسافات.`);
  }
}
