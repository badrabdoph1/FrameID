-- Communication Core is additive. Legacy communication tables remain available
-- until their writers and readers are migrated in a later phase.

CREATE TYPE "CommunicationConversationMode" AS ENUM ('DIRECT', 'BROADCAST');
CREATE TYPE "CommunicationLifecycleState" AS ENUM ('ACTIVE', 'ARCHIVED', 'WITHDRAWN');
CREATE TYPE "CommunicationReplyMode" AS ENUM ('ENABLED', 'DISABLED', 'PRIVATE_BRANCH');
CREATE TYPE "CommunicationActorType" AS ENUM ('CUSTOMER', 'ADMIN', 'SYSTEM');
CREATE TYPE "CommunicationEntryKind" AS ENUM ('MESSAGE', 'INTERNAL_NOTE', 'STATE_CHANGE', 'ASSIGNMENT', 'SYSTEM_EVENT', 'CORRECTION');
CREATE TYPE "CommunicationVisibility" AS ENUM ('CUSTOMER_AND_ADMIN', 'ADMIN_ONLY');
CREATE TYPE "CommunicationWorkItemStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED');
CREATE TYPE "CommunicationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "CommunicationWorkItemEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNED', 'QUEUE_CHANGED');
CREATE TYPE "CommunicationAttachmentScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'CLEAN', 'REJECTED', 'DELETED');
CREATE TYPE "CommunicationCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'WITHDRAWN', 'CANCELLED');
CREATE TYPE "CommunicationOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'DEAD_LETTER');
CREATE TYPE "CommunicationDeliveryStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'CANCELLED');

CREATE TABLE "CommunicationConversation" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "mode" "CommunicationConversationMode" NOT NULL,
    "tenantId" TEXT,
    "parentConversationId" TEXT,
    "sourceModule" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "lifecycleState" "CommunicationLifecycleState" NOT NULL DEFAULT 'ACTIVE',
    "replyMode" "CommunicationReplyMode" NOT NULL DEFAULT 'ENABLED',
    "createdByType" "CommunicationActorType" NOT NULL,
    "createdByUserId" TEXT,
    "createdByAdminUserId" TEXT,
    "createdBySystemKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "lastCustomerVisibleSequence" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationConversation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationConversation_scope_check" CHECK (
      ("mode" = 'DIRECT' AND "tenantId" IS NOT NULL)
      OR ("mode" = 'BROADCAST' AND "tenantId" IS NULL)
    ),
    CONSTRAINT "CommunicationConversation_creator_check" CHECK (
      ("createdByType" = 'CUSTOMER' AND "createdByUserId" IS NOT NULL AND "createdByAdminUserId" IS NULL AND "createdBySystemKey" IS NULL)
      OR ("createdByType" = 'ADMIN' AND "createdByUserId" IS NULL AND "createdByAdminUserId" IS NOT NULL AND "createdBySystemKey" IS NULL)
      OR ("createdByType" = 'SYSTEM' AND "createdByUserId" IS NULL AND "createdByAdminUserId" IS NULL AND "createdBySystemKey" IS NOT NULL)
    ),
    CONSTRAINT "CommunicationConversation_sequence_check" CHECK (
      "lastSequence" >= 0
      AND "lastCustomerVisibleSequence" >= 0
      AND "lastCustomerVisibleSequence" <= "lastSequence"
      AND "version" >= 0
    )
);

CREATE TABLE "CommunicationEntry" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "kind" "CommunicationEntryKind" NOT NULL DEFAULT 'MESSAGE',
    "visibility" "CommunicationVisibility" NOT NULL DEFAULT 'CUSTOMER_AND_ADMIN',
    "authorType" "CommunicationActorType" NOT NULL,
    "authorUserId" TEXT,
    "authorAdminUserId" TEXT,
    "authorSystemKey" TEXT,
    "body" TEXT,
    "eventName" TEXT,
    "metadata" JSONB,
    "correctionOfEntryId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redactedAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationEntry_author_check" CHECK (
      ("authorType" = 'CUSTOMER' AND "authorUserId" IS NOT NULL AND "authorAdminUserId" IS NULL AND "authorSystemKey" IS NULL)
      OR ("authorType" = 'ADMIN' AND "authorUserId" IS NULL AND "authorAdminUserId" IS NOT NULL AND "authorSystemKey" IS NULL)
      OR ("authorType" = 'SYSTEM' AND "authorUserId" IS NULL AND "authorAdminUserId" IS NULL AND "authorSystemKey" IS NOT NULL)
    ),
    CONSTRAINT "CommunicationEntry_sequence_check" CHECK ("sequence" > 0),
    CONSTRAINT "CommunicationEntry_internal_visibility_check" CHECK (
      "kind" <> 'INTERNAL_NOTE' OR "visibility" = 'ADMIN_ONLY'
    ),
    CONSTRAINT "CommunicationEntry_content_check" CHECK (
      "body" IS NOT NULL OR "eventName" IS NOT NULL
    )
);

CREATE TABLE "CommunicationAudience" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reasonCode" TEXT,
    "audienceVersion" INTEGER NOT NULL DEFAULT 1,
    "lastCustomerVisibleSequence" INTEGER NOT NULL DEFAULT 0,
    "deliveredAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationAudience_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationAudience_sequence_check" CHECK ("lastCustomerVisibleSequence" >= 0),
    CONSTRAINT "CommunicationAudience_version_check" CHECK ("audienceVersion" > 0)
);

CREATE TABLE "CommunicationReadCursor" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "readerType" "CommunicationActorType" NOT NULL,
    "userId" TEXT,
    "adminUserId" TEXT,
    "lastReadSequence" INTEGER NOT NULL DEFAULT 0,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationReadCursor_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationReadCursor_reader_check" CHECK (
      ("readerType" = 'CUSTOMER' AND "userId" IS NOT NULL AND "adminUserId" IS NULL)
      OR ("readerType" = 'ADMIN' AND "userId" IS NULL AND "adminUserId" IS NOT NULL)
    ),
    CONSTRAINT "CommunicationReadCursor_sequence_check" CHECK ("lastReadSequence" >= 0)
);

CREATE TABLE "CommunicationWorkItem" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "CommunicationWorkItemStatus" NOT NULL DEFAULT 'NEW',
    "priority" "CommunicationPriority" NOT NULL DEFAULT 'NORMAL',
    "queueKey" TEXT NOT NULL,
    "assigneeAdminUserId" TEXT,
    "slaPolicyKey" TEXT,
    "firstResponseDueAt" TIMESTAMP(3),
    "resolutionDueAt" TIMESTAMP(3),
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lastCustomerMessageAt" TIMESTAMP(3),
    "lastAdminReplyAt" TIMESTAMP(3),
    "waitingSince" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationWorkItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationWorkItem_version_check" CHECK ("version" >= 0)
);

CREATE TABLE "CommunicationWorkItemEvent" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "type" "CommunicationWorkItemEventType" NOT NULL,
    "actorType" "CommunicationActorType" NOT NULL,
    "actorUserId" TEXT,
    "actorAdminUserId" TEXT,
    "actorSystemKey" TEXT,
    "fromStatus" "CommunicationWorkItemStatus",
    "toStatus" "CommunicationWorkItemStatus",
    "fromPriority" "CommunicationPriority",
    "toPriority" "CommunicationPriority",
    "fromQueueKey" TEXT,
    "toQueueKey" TEXT,
    "fromAssigneeId" TEXT,
    "toAssigneeId" TEXT,
    "reason" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "correlationId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationWorkItemEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationWorkItemEvent_actor_check" CHECK (
      ("actorType" = 'CUSTOMER' AND "actorUserId" IS NOT NULL AND "actorAdminUserId" IS NULL AND "actorSystemKey" IS NULL)
      OR ("actorType" = 'ADMIN' AND "actorUserId" IS NULL AND "actorAdminUserId" IS NOT NULL AND "actorSystemKey" IS NULL)
      OR ("actorType" = 'SYSTEM' AND "actorUserId" IS NULL AND "actorAdminUserId" IS NULL AND "actorSystemKey" IS NOT NULL)
    )
);

CREATE TABLE "CommunicationContextReference" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relationKey" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationContextReference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunicationAttachment" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "scanStatus" "CommunicationAttachmentScanStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedByType" "CommunicationActorType" NOT NULL,
    "uploadedByUserId" TEXT,
    "uploadedByAdminUserId" TEXT,
    "uploadedBySystemKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CommunicationAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationAttachment_uploader_check" CHECK (
      ("uploadedByType" = 'CUSTOMER' AND "uploadedByUserId" IS NOT NULL AND "uploadedByAdminUserId" IS NULL AND "uploadedBySystemKey" IS NULL)
      OR ("uploadedByType" = 'ADMIN' AND "uploadedByUserId" IS NULL AND "uploadedByAdminUserId" IS NOT NULL AND "uploadedBySystemKey" IS NULL)
      OR ("uploadedByType" = 'SYSTEM' AND "uploadedByUserId" IS NULL AND "uploadedByAdminUserId" IS NULL AND "uploadedBySystemKey" IS NOT NULL)
    ),
    CONSTRAINT "CommunicationAttachment_size_check" CHECK ("sizeBytes" > 0),
    CONSTRAINT "CommunicationAttachment_dimensions_check" CHECK (
      ("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0)
    )
);

CREATE TABLE "CommunicationCampaign" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "CommunicationCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "audienceDefinition" JSONB NOT NULL,
    "audienceDefinitionVersion" INTEGER NOT NULL DEFAULT 1,
    "audienceCheckpoint" JSONB,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdByAdminUserId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "publishingStartedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "withdrawnReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationCampaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationCampaign_counts_check" CHECK (
      "audienceDefinitionVersion" > 0 AND "recipientCount" >= 0
    )
);

CREATE TABLE "CommunicationOutboxEvent" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "groupKey" TEXT,
    "deduplicationKey" TEXT NOT NULL,
    "correlationId" TEXT,
    "causationId" TEXT,
    "status" "CommunicationOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationOutboxEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationOutboxEvent_attempts_check" CHECK ("eventVersion" > 0 AND "attempts" >= 0)
);

CREATE TABLE "CommunicationDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "tenantId" TEXT,
    "channelKey" TEXT NOT NULL,
    "recipientKey" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" "CommunicationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "providerMessageId" TEXT,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunicationDeliveryAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CommunicationDeliveryAttempt_attempts_check" CHECK ("attempts" >= 0)
);

CREATE UNIQUE INDEX "CommunicationConversation_number_key" ON "CommunicationConversation"("number");
CREATE UNIQUE INDEX "CommunicationConversation_sourceModule_idempotencyKey_key" ON "CommunicationConversation"("sourceModule", "idempotencyKey");
CREATE INDEX "CommunicationConversation_tenantId_lifecycleState_lastActiv_idx" ON "CommunicationConversation"("tenantId", "lifecycleState", "lastActivityAt");
CREATE INDEX "CommunicationConversation_mode_lifecycleState_lastActivityA_idx" ON "CommunicationConversation"("mode", "lifecycleState", "lastActivityAt");
CREATE INDEX "CommunicationConversation_typeKey_lastActivityAt_idx" ON "CommunicationConversation"("typeKey", "lastActivityAt");
CREATE INDEX "CommunicationConversation_parentConversationId_idx" ON "CommunicationConversation"("parentConversationId");

CREATE UNIQUE INDEX "CommunicationEntry_conversationId_sequence_key" ON "CommunicationEntry"("conversationId", "sequence");
CREATE UNIQUE INDEX "CommunicationEntry_conversationId_idempotencyKey_key" ON "CommunicationEntry"("conversationId", "idempotencyKey");
CREATE INDEX "CommunicationEntry_conversationId_visibility_sequence_idx" ON "CommunicationEntry"("conversationId", "visibility", "sequence");
CREATE INDEX "CommunicationEntry_authorUserId_createdAt_idx" ON "CommunicationEntry"("authorUserId", "createdAt");
CREATE INDEX "CommunicationEntry_authorAdminUserId_createdAt_idx" ON "CommunicationEntry"("authorAdminUserId", "createdAt");
CREATE INDEX "CommunicationEntry_correctionOfEntryId_idx" ON "CommunicationEntry"("correctionOfEntryId");

CREATE UNIQUE INDEX "CommunicationAudience_conversationId_tenantId_key" ON "CommunicationAudience"("conversationId", "tenantId");
CREATE INDEX "CommunicationAudience_tenantId_archivedAt_deliveredAt_idx" ON "CommunicationAudience"("tenantId", "archivedAt", "deliveredAt");
CREATE INDEX "CommunicationAudience_conversationId_deliveredAt_idx" ON "CommunicationAudience"("conversationId", "deliveredAt");

CREATE UNIQUE INDEX "CommunicationReadCursor_conversationId_userId_key" ON "CommunicationReadCursor"("conversationId", "userId");
CREATE UNIQUE INDEX "CommunicationReadCursor_conversationId_adminUserId_key" ON "CommunicationReadCursor"("conversationId", "adminUserId");
CREATE INDEX "CommunicationReadCursor_userId_readAt_idx" ON "CommunicationReadCursor"("userId", "readAt");
CREATE INDEX "CommunicationReadCursor_adminUserId_readAt_idx" ON "CommunicationReadCursor"("adminUserId", "readAt");

CREATE UNIQUE INDEX "CommunicationWorkItem_conversationId_key" ON "CommunicationWorkItem"("conversationId");
CREATE INDEX "CommunicationWorkItem_status_priority_waitingSince_idx" ON "CommunicationWorkItem"("status", "priority", "waitingSince");
CREATE INDEX "CommunicationWorkItem_queueKey_status_priority_updatedAt_idx" ON "CommunicationWorkItem"("queueKey", "status", "priority", "updatedAt");
CREATE INDEX "CommunicationWorkItem_assigneeAdminUserId_status_updatedAt_idx" ON "CommunicationWorkItem"("assigneeAdminUserId", "status", "updatedAt");
CREATE INDEX "CommunicationWorkItem_firstResponseDueAt_idx" ON "CommunicationWorkItem"("firstResponseDueAt");
CREATE INDEX "CommunicationWorkItem_resolutionDueAt_idx" ON "CommunicationWorkItem"("resolutionDueAt");

CREATE INDEX "CommunicationWorkItemEvent_workItemId_occurredAt_idx" ON "CommunicationWorkItemEvent"("workItemId", "occurredAt");
CREATE UNIQUE INDEX "CommunicationWorkItemEvent_workItemId_idempotencyKey_key" ON "CommunicationWorkItemEvent"("workItemId", "idempotencyKey");
CREATE INDEX "CommunicationWorkItemEvent_type_occurredAt_idx" ON "CommunicationWorkItemEvent"("type", "occurredAt");
CREATE INDEX "CommunicationWorkItemEvent_actorAdminUserId_occurredAt_idx" ON "CommunicationWorkItemEvent"("actorAdminUserId", "occurredAt");

CREATE UNIQUE INDEX "CommunicationContextReference_context_key" ON "CommunicationContextReference"("conversationId", "namespace", "entityType", "entityId", "relationKey");
CREATE INDEX "CommunicationContextReference_namespace_entityType_entityId_idx" ON "CommunicationContextReference"("namespace", "entityType", "entityId");
CREATE INDEX "CommunicationContextReference_conversationId_relationKey_idx" ON "CommunicationContextReference"("conversationId", "relationKey");

CREATE UNIQUE INDEX "CommunicationAttachment_storageKey_key" ON "CommunicationAttachment"("storageKey");
CREATE INDEX "CommunicationAttachment_entryId_createdAt_idx" ON "CommunicationAttachment"("entryId", "createdAt");
CREATE INDEX "CommunicationAttachment_scanStatus_createdAt_idx" ON "CommunicationAttachment"("scanStatus", "createdAt");
CREATE INDEX "CommunicationAttachment_checksumSha256_idx" ON "CommunicationAttachment"("checksumSha256");

CREATE UNIQUE INDEX "CommunicationCampaign_conversationId_key" ON "CommunicationCampaign"("conversationId");
CREATE INDEX "CommunicationCampaign_status_scheduledAt_idx" ON "CommunicationCampaign"("status", "scheduledAt");
CREATE INDEX "CommunicationCampaign_createdByAdminUserId_createdAt_idx" ON "CommunicationCampaign"("createdByAdminUserId", "createdAt");

CREATE UNIQUE INDEX "CommunicationOutboxEvent_deduplicationKey_key" ON "CommunicationOutboxEvent"("deduplicationKey");
CREATE INDEX "CommunicationOutboxEvent_status_availableAt_leaseExpiresAt_idx" ON "CommunicationOutboxEvent"("status", "availableAt", "leaseExpiresAt");
CREATE INDEX "CommunicationOutboxEvent_aggregateType_aggregateId_createdA_idx" ON "CommunicationOutboxEvent"("aggregateType", "aggregateId", "createdAt");
CREATE INDEX "CommunicationOutboxEvent_correlationId_createdAt_idx" ON "CommunicationOutboxEvent"("correlationId", "createdAt");
CREATE INDEX "CommunicationOutboxEvent_categoryKey_createdAt_idx" ON "CommunicationOutboxEvent"("categoryKey", "createdAt");

CREATE UNIQUE INDEX "CommunicationDeliveryAttempt_idempotencyKey_key" ON "CommunicationDeliveryAttempt"("idempotencyKey");
CREATE INDEX "CommunicationDeliveryAttempt_status_availableAt_leaseExpire_idx" ON "CommunicationDeliveryAttempt"("status", "availableAt", "leaseExpiresAt");
CREATE INDEX "CommunicationDeliveryAttempt_outboxEventId_channelKey_idx" ON "CommunicationDeliveryAttempt"("outboxEventId", "channelKey");
CREATE INDEX "CommunicationDeliveryAttempt_tenantId_channelKey_createdAt_idx" ON "CommunicationDeliveryAttempt"("tenantId", "channelKey", "createdAt");

ALTER TABLE "CommunicationConversation" ADD CONSTRAINT "CommunicationConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationConversation" ADD CONSTRAINT "CommunicationConversation_parentConversationId_fkey" FOREIGN KEY ("parentConversationId") REFERENCES "CommunicationConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunicationConversation" ADD CONSTRAINT "CommunicationConversation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationConversation" ADD CONSTRAINT "CommunicationConversation_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationEntry" ADD CONSTRAINT "CommunicationEntry_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationEntry" ADD CONSTRAINT "CommunicationEntry_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationEntry" ADD CONSTRAINT "CommunicationEntry_authorAdminUserId_fkey" FOREIGN KEY ("authorAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationEntry" ADD CONSTRAINT "CommunicationEntry_correctionOfEntryId_fkey" FOREIGN KEY ("correctionOfEntryId") REFERENCES "CommunicationEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunicationAudience" ADD CONSTRAINT "CommunicationAudience_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationAudience" ADD CONSTRAINT "CommunicationAudience_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationReadCursor" ADD CONSTRAINT "CommunicationReadCursor_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationReadCursor" ADD CONSTRAINT "CommunicationReadCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationReadCursor" ADD CONSTRAINT "CommunicationReadCursor_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationWorkItem" ADD CONSTRAINT "CommunicationWorkItem_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationWorkItem" ADD CONSTRAINT "CommunicationWorkItem_assigneeAdminUserId_fkey" FOREIGN KEY ("assigneeAdminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CommunicationWorkItemEvent" ADD CONSTRAINT "CommunicationWorkItemEvent_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "CommunicationWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationWorkItemEvent" ADD CONSTRAINT "CommunicationWorkItemEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationWorkItemEvent" ADD CONSTRAINT "CommunicationWorkItemEvent_actorAdminUserId_fkey" FOREIGN KEY ("actorAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationContextReference" ADD CONSTRAINT "CommunicationContextReference_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunicationAttachment" ADD CONSTRAINT "CommunicationAttachment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "CommunicationEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationAttachment" ADD CONSTRAINT "CommunicationAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunicationAttachment" ADD CONSTRAINT "CommunicationAttachment_uploadedByAdminUserId_fkey" FOREIGN KEY ("uploadedByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationCampaign" ADD CONSTRAINT "CommunicationCampaign_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CommunicationConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationCampaign" ADD CONSTRAINT "CommunicationCampaign_createdByAdminUserId_fkey" FOREIGN KEY ("createdByAdminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CommunicationDeliveryAttempt" ADD CONSTRAINT "CommunicationDeliveryAttempt_outboxEventId_fkey" FOREIGN KEY ("outboxEventId") REFERENCES "CommunicationOutboxEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
