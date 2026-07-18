import type {
  CommunicationActor,
  CommunicationAttachmentInput,
  CommunicationContextReferenceInput,
  CommunicationConversationMode,
  CommunicationEntryKind,
  CommunicationPriority,
  CommunicationReader,
  CommunicationVisibility,
  CommunicationWorkItemStatus,
} from "./types";

export type CommandTrace = {
  correlationId: string | null;
  causationId: string | null;
  occurredAt: Date;
};

export type NormalizedEntryDraft = {
  actor: CommunicationActor;
  kind: CommunicationEntryKind;
  visibility: CommunicationVisibility;
  body: string | null;
  eventName: string | null;
  metadata: Record<string, unknown> | null;
  correctionOfEntryId: string | null;
  idempotencyKey: string;
  attachments: CommunicationAttachmentInput[];
};

export type OpenConversationCommand = CommandTrace & {
  sourceModule: string;
  idempotencyKey: string;
  mode: CommunicationConversationMode;
  tenantId: string | null;
  parentConversationId: string | null;
  typeKey: string;
  subject: string;
  replyMode: "ENABLED" | "DISABLED" | "PRIVATE_BRANCH";
  actor: CommunicationActor;
  firstEntry: NormalizedEntryDraft;
  workItem: {
    queueKey: string;
    priority: CommunicationPriority;
    assigneeAdminUserId: string | null;
    slaPolicyKey: string | null;
    firstResponseDueAt: Date | null;
    resolutionDueAt: Date | null;
  } | null;
  contexts: CommunicationContextReferenceInput[];
};

export type AppendEntryCommand = CommandTrace & NormalizedEntryDraft & {
  conversationId: string;
  expectedLastSequence: number;
  expectedVersion: number;
};

export type AttachContextCommand = CommandTrace & {
  conversationId: string;
  sourceModule: string;
  actor: Extract<CommunicationActor, { type: "SYSTEM" }>;
  context: CommunicationContextReferenceInput;
  idempotencyKey: string;
};

export type MarkReadCommand = {
  conversationId: string;
  reader: CommunicationReader;
  upToSequence: number;
  occurredAt: Date;
};

export type TransitionWorkItemCommand = CommandTrace & {
  workItemId: string;
  actor: CommunicationActor;
  fromStatus: CommunicationWorkItemStatus;
  toStatus: CommunicationWorkItemStatus;
  expectedVersion: number;
  reason: string | null;
  idempotencyKey: string;
};

export type ManageWorkItemChange =
  | { type: "PRIORITY"; fromPriority: CommunicationPriority; toPriority: CommunicationPriority }
  | { type: "ASSIGNEE"; fromAssigneeAdminUserId: string | null; toAssigneeAdminUserId: string | null }
  | { type: "QUEUE"; fromQueueKey: string; toQueueKey: string };

export type ManageWorkItemCommand = CommandTrace & {
  workItemId: string;
  actor: Extract<CommunicationActor, { type: "ADMIN" }>;
  expectedVersion: number;
  change: ManageWorkItemChange;
  reason: string | null;
  idempotencyKey: string;
};

export type PublishCampaignCommand = CommandTrace & {
  sourceModule: string;
  idempotencyKey: string;
  typeKey: string;
  subject: string;
  actor: Extract<CommunicationActor, { type: "ADMIN" }>;
  tenantIds: string[];
  audienceDefinition: Record<string, unknown>;
  audienceDefinitionVersion: number;
  scheduledAt: Date | null;
  entry: NormalizedEntryDraft;
};

export type WithdrawCampaignCommand = CommandTrace & {
  campaignId: string;
  actor: Extract<CommunicationActor, { type: "ADMIN" }>;
  reason: string;
  idempotencyKey: string;
};

export type OpenConversationResult = {
  conversationId: string;
  number: number;
  entryId: string;
  sequence: number;
  workItemId: string | null;
};

export type AppendEntryResult = {
  conversationId: string;
  entryId: string;
  sequence: number;
  version: number;
};

export type ContextReferenceRecord = CommunicationContextReferenceInput & {
  id: string;
  conversationId: string;
  sourceModule: string;
  createdAt: Date;
};

export type ReadCursorRecord = {
  conversationId: string;
  reader: CommunicationReader;
  lastReadSequence: number;
  readAt: Date;
};

export type WorkItemState = {
  id: string;
  status: CommunicationWorkItemStatus;
  priority: CommunicationPriority;
  queueKey: string;
  assigneeAdminUserId: string | null;
  version: number;
};

export type PublishCampaignResult = {
  campaignId: string;
  conversationId: string;
  number: number;
  recipientCount: number;
};

export type WithdrawCampaignResult = { campaignId: string; conversationId: string; withdrawnAt: Date };

export interface CommunicationRepository {
  openConversation(command: OpenConversationCommand): Promise<OpenConversationResult>;
  appendEntry(command: AppendEntryCommand): Promise<AppendEntryResult>;
  attachContext(command: AttachContextCommand): Promise<ContextReferenceRecord>;
  markRead(command: MarkReadCommand): Promise<ReadCursorRecord>;
  getWorkItemState(workItemId: string): Promise<WorkItemState | null>;
  transitionWorkItem(command: TransitionWorkItemCommand): Promise<WorkItemState>;
  manageWorkItem(command: ManageWorkItemCommand): Promise<WorkItemState>;
  publishCampaign(command: PublishCampaignCommand): Promise<PublishCampaignResult>;
  withdrawCampaign(command: WithdrawCampaignCommand): Promise<WithdrawCampaignResult>;
}
