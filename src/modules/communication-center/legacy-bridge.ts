import type { OpenConversationInput, PublishCampaignInput } from "@/modules/communication-core/types";
import type { OpenConversationResult, PublishCampaignResult } from "@/modules/communication-core/repository";

type LegacyBridgeCore = {
  openConversation(input: OpenConversationInput): Promise<OpenConversationResult>;
  publishCampaign(input: PublishCampaignInput): Promise<PublishCampaignResult>;
};

function stableSuffix(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "general";
}

const requestTypeMap: Record<string, { typeKey: string; queueKey: string; priority: "NORMAL" | "HIGH" }> = {
  ACCOUNT_DELETION: { typeKey: "account.deletion", queueKey: "account", priority: "HIGH" },
  FEATURE_ACTIVATION: { typeKey: "feature.activation", queueKey: "product", priority: "NORMAL" },
  UPGRADE: { typeKey: "billing.upgrade", queueKey: "billing", priority: "NORMAL" },
  ADDITIONAL_SERVICE: { typeKey: "service.additional", queueKey: "services", priority: "NORMAL" },
  OTHER: { typeKey: "other.request", queueKey: "support", priority: "NORMAL" },
};

export function createCommunicationLegacyBridge(core: LegacyBridgeCore) {
  return {
    publishCampaign(input: {
      campaignId: string;
      tenantIds: string[];
      title: string;
      body: string;
      tone: string;
      audienceMode: string;
      filters: Record<string, unknown>;
      actor: { id: string; name: string; email?: string };
    }) {
      const typeKey = input.tone === "danger"
        ? "announcement.alert"
        : input.tone === "success"
          ? "announcement.feature"
          : "announcement.notice";
      return core.publishCampaign({
        sourceModule: "legacy-messages",
        idempotencyKey: `legacy-campaign:${input.campaignId}`,
        typeKey,
        subject: input.title,
        body: input.body,
        actor: { type: "ADMIN", adminUserId: input.actor.id },
        tenantIds: input.tenantIds,
        audienceDefinition: {
          legacyCampaignId: input.campaignId,
          mode: input.audienceMode,
          filters: input.filters,
        },
        audienceDefinitionVersion: 1,
      });
    },

    publishNotification(input: {
      sourceModule: string;
      sourceId: string;
      tenantId: string;
      type: string;
      title: string;
      body: string;
      context?: { namespace: string; entityType: string; entityId: string; relationKey: string };
    }) {
      const sourceModule = stableSuffix(input.sourceModule);
      return core.openConversation({
        sourceModule,
        idempotencyKey: `legacy-notification:${input.sourceId}`,
        mode: "DIRECT",
        tenantId: input.tenantId,
        typeKey: `notification.${stableSuffix(input.type)}`,
        subject: input.title,
        replyMode: "DISABLED",
        actor: { type: "SYSTEM", systemKey: sourceModule },
        firstEntry: { body: input.body, idempotencyKey: `legacy-notification:${input.sourceId}:entry` },
        contexts: input.context ? [input.context] : [],
      });
    },

    publishCustomerRequest(input: {
      requestId: string;
      tenantId: string;
      siteId: string;
      type: string;
      title: string;
      description: string | null;
    }) {
      const policy = requestTypeMap[input.type] ?? { typeKey: "other.request", queueKey: "support", priority: "NORMAL" as const };
      return core.openConversation({
        sourceModule: "customers",
        idempotencyKey: `legacy-customer-request:${input.requestId}`,
        mode: "DIRECT",
        tenantId: input.tenantId,
        typeKey: policy.typeKey,
        subject: input.title,
        replyMode: "ENABLED",
        actor: { type: "SYSTEM", systemKey: "customers" },
        firstEntry: { body: input.description || input.title, idempotencyKey: `legacy-customer-request:${input.requestId}:entry` },
        workItem: { queueKey: policy.queueKey, priority: policy.priority, slaPolicyKey: "account-request-v1" },
        contexts: [
          { namespace: "customers", entityType: "customer_request", entityId: input.requestId, relationKey: "source" },
          { namespace: "sites", entityType: "site", entityId: input.siteId, relationKey: "related" },
        ],
      });
    },

    publishSupportCase(input: {
      supportCaseId: string;
      tenantId: string;
      openedById: string | null;
      subject: string;
      description: string;
    }) {
      const actor = input.openedById
        ? { type: "CUSTOMER" as const, userId: input.openedById }
        : { type: "SYSTEM" as const, systemKey: "support" };
      return core.openConversation({
        sourceModule: "support",
        idempotencyKey: `legacy-support-case:${input.supportCaseId}`,
        mode: "DIRECT",
        tenantId: input.tenantId,
        typeKey: "support.case",
        subject: input.subject,
        replyMode: "ENABLED",
        actor,
        firstEntry: { body: input.description, idempotencyKey: `legacy-support-case:${input.supportCaseId}:entry` },
        workItem: { queueKey: "support", priority: "NORMAL", slaPolicyKey: "support-standard-v1" },
        contexts: [{ namespace: "support", entityType: "support_case", entityId: input.supportCaseId, relationKey: "source" }],
      });
    },
  };
}
