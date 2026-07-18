import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
const migrationPath = join(
  process.cwd(),
  "prisma/migrations/20260718190000_communication_core/migration.sql",
);
const migration = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";

describe("communication core schema contract", () => {
  it("declares the product-neutral communication aggregates", () => {
    for (const model of [
      "CommunicationConversation",
      "CommunicationEntry",
      "CommunicationAudience",
      "CommunicationReadCursor",
      "CommunicationWorkItem",
      "CommunicationWorkItemEvent",
      "CommunicationContextReference",
      "CommunicationAttachment",
      "CommunicationCampaign",
      "CommunicationOutboxEvent",
      "CommunicationDeliveryAttempt",
    ]) {
      expect(schema).toContain(`model ${model}`);
    }
  });

  it("keeps product context opaque and indexed for reverse lookup", () => {
    const context = schema.match(/model CommunicationContextReference \{([\s\S]*?)\n\}/)?.[1] ?? "";

    expect(context).toMatch(/namespace\s+String/);
    expect(context).toMatch(/entityType\s+String/);
    expect(context).toMatch(/entityId\s+String/);
    expect(context).toMatch(/relationKey\s+String/);
    expect(context).toContain('map: "CommunicationContextReference_context_key"');
    expect(context).toContain("@@index([namespace, entityType, entityId])");
    expect(context).not.toMatch(/\b(site|payment|subscription|product)Id\b/);
  });

  it("ships database constraints for scope and explicit actors", () => {
    expect(migration).toContain('CONSTRAINT "CommunicationConversation_scope_check"');
    expect(migration).toContain('CONSTRAINT "CommunicationConversation_creator_check"');
    expect(migration).toContain('CONSTRAINT "CommunicationEntry_author_check"');
    expect(migration).toContain('CONSTRAINT "CommunicationReadCursor_reader_check"');
    expect(migration).toContain('CONSTRAINT "CommunicationAttachment_uploader_check"');
  });

  it("protects ordering, idempotency, audience and delivery claims", () => {
    expect(migration).toContain('"CommunicationEntry_conversationId_sequence_key"');
    expect(migration).toContain('"CommunicationEntry_conversationId_idempotencyKey_key"');
    expect(migration).toContain('"CommunicationAudience_conversationId_tenantId_key"');
    expect(migration).toContain('"CommunicationWorkItemEvent_workItemId_idempotencyKey_key"');
    expect(migration).toContain('"CommunicationOutboxEvent_deduplicationKey_key"');
    expect(migration).toContain('"CommunicationOutboxEvent_status_availableAt_leaseExpiresAt_idx"');
    expect(migration).toContain('"CommunicationWorkItem_status_priority_waitingSince_idx"');
  });

  it("keeps message content out of campaign and delivery records", () => {
    const campaign = schema.match(/model CommunicationCampaign \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const outbox = schema.match(/model CommunicationOutboxEvent \{([\s\S]*?)\n\}/)?.[1] ?? "";
    const delivery = schema.match(/model CommunicationDeliveryAttempt \{([\s\S]*?)\n\}/)?.[1] ?? "";

    expect(campaign).not.toMatch(/\b(title|subject|body)\b/);
    expect(outbox).not.toMatch(/\b(title|subject|body)\b/);
    expect(delivery).not.toMatch(/\b(title|subject|body)\b/);
  });
});
