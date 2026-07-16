CREATE TABLE "CustomerMessageCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'info',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "audienceMode" TEXT NOT NULL,
    "audienceSnapshot" JSONB,
    "createdByAdminId" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerMessageCampaign_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CustomerMessageCampaign_tone_check" CHECK ("tone" IN ('info', 'success', 'warning', 'danger')),
    CONSTRAINT "CustomerMessageCampaign_status_check" CHECK ("status" IN ('ACTIVE', 'PAUSED')),
    CONSTRAINT "CustomerMessageCampaign_audienceMode_check" CHECK ("audienceMode" IN ('ALL_MATCHING', 'EXPLICIT'))
);

CREATE TABLE "CustomerMessageRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMessageRecipient_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerMessageCampaign_status_createdAt_idx" ON "CustomerMessageCampaign"("status", "createdAt");
CREATE INDEX "CustomerMessageCampaign_createdByAdminId_createdAt_idx" ON "CustomerMessageCampaign"("createdByAdminId", "createdAt");
CREATE UNIQUE INDEX "CustomerMessageRecipient_campaignId_tenantId_key" ON "CustomerMessageRecipient"("campaignId", "tenantId");
CREATE INDEX "CustomerMessageRecipient_tenantId_createdAt_idx" ON "CustomerMessageRecipient"("tenantId", "createdAt");
CREATE INDEX "CustomerMessageRecipient_campaignId_createdAt_idx" ON "CustomerMessageRecipient"("campaignId", "createdAt");

ALTER TABLE "CustomerMessageRecipient"
ADD CONSTRAINT "CustomerMessageRecipient_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "CustomerMessageCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerMessageRecipient"
ADD CONSTRAINT "CustomerMessageRecipient_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
