export const communicationConversationModes = ["DIRECT", "BROADCAST"] as const;
export const communicationEntryKinds = [
  "MESSAGE",
  "INTERNAL_NOTE",
  "STATE_CHANGE",
  "ASSIGNMENT",
  "SYSTEM_EVENT",
  "CORRECTION",
] as const;
export const communicationVisibilities = ["CUSTOMER_AND_ADMIN", "ADMIN_ONLY"] as const;
export const communicationWorkItemStatuses = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_CUSTOMER",
  "WAITING_INTERNAL",
  "RESOLVED",
  "CLOSED",
] as const;
export const communicationPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type CommunicationConversationMode = (typeof communicationConversationModes)[number];
export type CommunicationEntryKind = (typeof communicationEntryKinds)[number];
export type CommunicationVisibility = (typeof communicationVisibilities)[number];
export type CommunicationWorkItemStatus = (typeof communicationWorkItemStatuses)[number];
export type CommunicationPriority = (typeof communicationPriorities)[number];

export type CommunicationActor =
  | { type: "CUSTOMER"; userId: string }
  | { type: "ADMIN"; adminUserId: string }
  | { type: "SYSTEM"; systemKey: string };

export type CommunicationReader = Exclude<CommunicationActor, { type: "SYSTEM" }>;

export type CommunicationContextReferenceInput = {
  namespace: string;
  entityType: string;
  entityId: string;
  relationKey: string;
};

export type CommunicationAttachmentInput = {
  storageProvider: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  width?: number | null;
  height?: number | null;
};

export type CommunicationEntryInput = {
  body?: string | null;
  eventName?: string | null;
  metadata?: Record<string, unknown> | null;
  kind?: CommunicationEntryKind;
  visibility?: CommunicationVisibility;
  correctionOfEntryId?: string | null;
  idempotencyKey: string;
  attachments?: CommunicationAttachmentInput[];
};

export type CommunicationWorkItemInput = {
  queueKey: string;
  priority?: CommunicationPriority;
  assigneeAdminUserId?: string | null;
  slaPolicyKey?: string | null;
  firstResponseDueAt?: Date | null;
  resolutionDueAt?: Date | null;
};

export type OpenConversationInput = {
  sourceModule: string;
  idempotencyKey: string;
  mode: CommunicationConversationMode;
  tenantId?: string | null;
  parentConversationId?: string | null;
  typeKey: string;
  subject: string;
  replyMode?: "ENABLED" | "DISABLED" | "PRIVATE_BRANCH";
  actor: CommunicationActor;
  firstEntry: CommunicationEntryInput;
  workItem?: CommunicationWorkItemInput | null;
  contexts?: CommunicationContextReferenceInput[];
  correlationId?: string | null;
  causationId?: string | null;
};

export type AppendEntryInput = CommunicationEntryInput & {
  conversationId: string;
  actor: CommunicationActor;
  expectedLastSequence: number;
  expectedVersion: number;
  correlationId?: string | null;
  causationId?: string | null;
};

export type AppendSystemEventInput = {
  conversationId: string;
  systemKey: string;
  eventName: string;
  body?: string | null;
  metadata?: Record<string, unknown> | null;
  visibility?: CommunicationVisibility;
  idempotencyKey: string;
  expectedLastSequence: number;
  expectedVersion: number;
  correlationId?: string | null;
  causationId?: string | null;
};

export type AttachContextInput = {
  conversationId: string;
  sourceModule: string;
  context: CommunicationContextReferenceInput;
  idempotencyKey: string;
  correlationId?: string | null;
  causationId?: string | null;
};

export type MarkReadInput = {
  conversationId: string;
  reader: CommunicationReader;
  upToSequence: number;
};

export type TransitionWorkItemInput = {
  workItemId: string;
  toStatus: CommunicationWorkItemStatus;
  actor: CommunicationActor;
  reason?: string | null;
  idempotencyKey: string;
  correlationId?: string | null;
  causationId?: string | null;
};

export type PublishCampaignInput = {
  sourceModule: string;
  idempotencyKey: string;
  typeKey: string;
  subject: string;
  body: string;
  actor: Extract<CommunicationActor, { type: "ADMIN" }>;
  tenantIds: string[];
  audienceDefinition: Record<string, unknown>;
  audienceDefinitionVersion: number;
  scheduledAt?: Date | null;
  correlationId?: string | null;
  causationId?: string | null;
};
